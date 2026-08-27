import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { computeWorkflowId } from './workflow-link.util';

interface PrerequisiteItemForWorkflow {
  key: string;
  label: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

interface WorkflowDoc {
  workflow_id: string;
  workflow_label?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  [key: string]: unknown;
}

const START_ID = 'start';
const END_ID = 'end';
const STEP_SPACING_Y = 150;

/**
 * Construit/synchronise LA chaîne de workflow d'un médecin pour une réunion, à partir de
 * ses prérequis : Début → prérequis 1 → prérequis 2 → ... → Fin (un seul workflow par
 * couple meetingId/doctorId — pas un par prérequis).
 *
 * IMPORTANT — contraintes de l'Orchestrator (vérifiées manuellement avant implémentation) :
 * - Pas de modèle de données propre : simple proxy vers un backend Olga fermé (port 9091).
 * - Pas d'authentification, pas d'endpoint de suppression de workflow.
 * - Les champs additionnels du JSON `workflow` (ex. `oncocollab_item_key` sur un nœud) sont
 *   conservés tels quels par le backend Olga — confirmé par un aller-retour PUT/GET de test.
 * Toute cette classe est "best-effort" : un échec ici ne doit jamais faire échouer la
 * création de la réunion / des prérequis (cf. appel non bloquant depuis MeetingsService).
 */
@Injectable()
export class WorkflowLinkService {
  private readonly logger = new Logger(WorkflowLinkService.name);
  private readonly orchestratorBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.orchestratorBaseUrl = (
      this.configService.get<string>('WORKFLOW_ORCHESTRATOR_URL') || 'http://localhost:9092'
    ).replace(/\/$/, '');
  }

  /**
   * Crée ou met à jour le workflow d'un médecin pour une réunion afin qu'il contienne
   * exactement une étape par prérequis, dans l'ordre fourni. Idempotent : n'écrit rien si
   * tous les prérequis ont déjà leur étape.
   */
  async ensureWorkflowForDoctor(
    meetingId: string,
    doctorId: string,
    doctorLabel: string,
    items: PrerequisiteItemForWorkflow[],
  ): Promise<void> {
    const validItems = items.filter((item) => !!item.key);
    const workflowId = computeWorkflowId(meetingId, doctorId);

    let existing: WorkflowDoc | null = null;
    try {
      const { data } = await axios.get<WorkflowDoc>(
        `${this.orchestratorBaseUrl}/workflows/${encodeURIComponent(workflowId)}`,
      );
      existing = data;
    } catch {
      existing = null; // 502 attendu quand le workflow n'existe pas encore côté Orchestrator.
    }

    try {
      if (!existing) {
        const workflow = this.buildFreshWorkflow(workflowId, doctorLabel, meetingId, doctorId, validItems);
        await this.saveWorkflow(workflowId, workflow);
        this.logger.log(
          `Workflow créé (${workflowId}) avec ${validItems.length} étape(s) pour le médecin ${doctorId} (réunion ${meetingId})`,
        );
        return;
      }

      const merge = this.mergeItemsIntoWorkflow(existing, meetingId, doctorId, validItems);
      if (merge.changed) {
        await this.saveWorkflow(workflowId, merge.workflow);
        this.logger.log(
          `Workflow ${workflowId} synchronisé : ${merge.added.length} étape(s) ajoutée(s) (${merge.added.join(', ')})`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Impossible de créer/synchroniser le workflow ${workflowId} (réunion ${meetingId}, médecin ${doctorId}): ${err}`,
      );
    }
  }

  private async saveWorkflow(workflowId: string, workflow: WorkflowDoc): Promise<void> {
    await axios.put(`${this.orchestratorBaseUrl}/workflows/${encodeURIComponent(workflowId)}`, {
      edited_by: 'oncocollab',
      workflow,
    });
  }

  /**
   * Construit la chaîne Début → étape 1 → étape 2 → ... → Fin à partir de zéro.
   */
  private buildFreshWorkflow(
    workflowId: string,
    doctorLabel: string,
    meetingId: string,
    doctorId: string,
    items: PrerequisiteItemForWorkflow[],
  ): WorkflowDoc {
    const stepNodes: WorkflowNode[] = items.map((item, index) =>
      this.buildStepNode(item, index, meetingId, doctorId),
    );

    const nodes: WorkflowNode[] = [
      { id: START_ID, type: 'start', position: { x: 0, y: 0 }, data: { type: 'start' } },
      ...stepNodes,
      {
        id: END_ID,
        type: 'end',
        // Convention observée sur les workflows existants : le nœud "end" porte data.type="start".
        position: { x: 0, y: (items.length + 1) * STEP_SPACING_Y },
        data: { type: 'start' },
      },
    ];

    const chainIds = [START_ID, ...items.map((item) => item.key), END_ID];
    const edges = this.buildLinearEdges(chainIds);

    return {
      workflow_id: workflowId,
      workflow_label: `Prérequis — ${doctorLabel}`,
      nodes,
      edges,
    };
  }

  /**
   * Insère les prérequis absents de la chaîne existante, juste avant le nœud "Fin",
   * sans toucher aux nœuds/arêtes déjà présents (positions, éventuelles modifications
   * manuelles). Ne fait rien si tous les prérequis ont déjà leur étape (pas de doublon).
   */
  private mergeItemsIntoWorkflow(
    existing: WorkflowDoc,
    meetingId: string,
    doctorId: string,
    items: PrerequisiteItemForWorkflow[],
  ): { changed: boolean; workflow: WorkflowDoc; added: string[] } {
    const nodes = Array.isArray(existing.nodes) ? [...existing.nodes] : [];
    const edges = Array.isArray(existing.edges) ? [...existing.edges] : [];

    const existingItemKeys = new Set(
      nodes
        .map((n) => n?.data?.oncocollab_item_key)
        .filter((key): key is string => typeof key === 'string'),
    );

    const missing = items.filter((item) => !existingItemKeys.has(item.key));
    if (missing.length === 0) {
      return { changed: false, workflow: existing, added: [] };
    }

    const endNode = nodes.find((n) => n.type === 'end') ?? nodes.find((n) => n.id === END_ID);
    const incomingToEndEdge = endNode ? edges.find((e) => e.target === endNode.id) : undefined;
    const startNode = nodes.find((n) => n.type === 'start') ?? nodes.find((n) => n.id === START_ID);
    let previousId = incomingToEndEdge?.source ?? startNode?.id ?? START_ID;

    const filteredEdges = incomingToEndEdge ? edges.filter((e) => e !== incomingToEndEdge) : edges;
    const maxY = nodes.reduce((max, n) => Math.max(max, Number(n?.position?.y) || 0), 0);

    const newNodes: WorkflowNode[] = [];
    const newEdges: WorkflowEdge[] = [];

    missing.forEach((item, index) => {
      const node = this.buildStepNode(item, index, meetingId, doctorId, maxY);
      newNodes.push(node);
      newEdges.push(this.buildEdge(previousId, node.id));
      previousId = node.id;
    });

    if (endNode) {
      newEdges.push(this.buildEdge(previousId, endNode.id));
    }

    return {
      changed: true,
      added: missing.map((item) => item.key),
      workflow: {
        ...existing,
        nodes: [...nodes, ...newNodes],
        edges: [...filteredEdges, ...newEdges],
      },
    };
  }

  private buildStepNode(
    item: PrerequisiteItemForWorkflow,
    index: number,
    meetingId: string,
    doctorId: string,
    baseY = 0,
  ): WorkflowNode {
    return {
      id: item.key,
      type: 'form',
      position: { x: 0, y: baseY + (index + 1) * STEP_SPACING_Y },
      data: {
        type: 'form',
        form_id: item.key,
        form_label: item.label || item.key,
        form_groups: [],
        form_actors: [],
        // Relation stable vers le prérequis OncoCollab d'origine (pas juste le libellé copié) —
        // utilisée par workflow-editor.html pour ouvrir le vrai formulaire/prérequis.
        oncocollab_item_key: item.key,
        oncocollab_meeting_id: meetingId,
        oncocollab_doctor_id: doctorId,
      },
    };
  }

  private buildEdge(source: string, target: string): WorkflowEdge {
    return { id: `xy-edge__${source}-${target}`, source, target, animated: true };
  }

  private buildLinearEdges(chainIds: string[]): WorkflowEdge[] {
    const edges: WorkflowEdge[] = [];
    for (let i = 0; i < chainIds.length - 1; i++) {
      edges.push(this.buildEdge(chainIds[i], chainIds[i + 1]));
    }
    return edges;
  }
}

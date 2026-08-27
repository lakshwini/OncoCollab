import { MigrationInterface, QueryRunner, Table, TableIndex, TableColumn } from 'typeorm';

export class AddTranscriptionBlocks1735400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table transcription_blocks
    await queryRunner.createTable(
      new Table({
        name: 'transcription_blocks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'meeting_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'speaker_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'speaker_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'block_order',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'timestamp_seconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '20',
            default: "'speechcore'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['meeting_id'],
            referencedTableName: 'meetings',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Créer index pour améliorer les performances
    await queryRunner.createIndex(
      'transcription_blocks',
      new TableIndex({
        columnNames: ['meeting_id', 'block_order'],
      }),
    );

    // Ajouter colonne speaker_blocks à meeting_transcripts (si elle n'existe pas)
    const table = await queryRunner.getTable('meeting_transcripts');
    if (table && !table.findColumnByName('speaker_blocks')) {
      await queryRunner.addColumn(
        'meeting_transcripts',
        new TableColumn({
          name: 'speaker_blocks',
          type: 'jsonb',
          isNullable: true,
          comment: 'Array of transcription blocks with speaker information',
        }),
      );
    }

    // Ajouter colonne transcription_source à meeting_transcripts
    if (table && !table.findColumnByName('transcription_source')) {
      await queryRunner.addColumn(
        'meeting_transcripts',
        new TableColumn({
          name: 'transcription_source',
          type: 'varchar',
          length: '20',
          default: "'whisper'",
          isNullable: false,
          comment: 'Source de la transcription: speechcore, whisper, ou manual',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes ajoutées
    const table = await queryRunner.getTable('meeting_transcripts');
    if (table && table.findColumnByName('speaker_blocks')) {
      await queryRunner.dropColumn('meeting_transcripts', 'speaker_blocks');
    }
    if (table && table.findColumnByName('transcription_source')) {
      await queryRunner.dropColumn('meeting_transcripts', 'transcription_source');
    }

    // Supprimer la table
    await queryRunner.dropTable('transcription_blocks', true);
  }
}

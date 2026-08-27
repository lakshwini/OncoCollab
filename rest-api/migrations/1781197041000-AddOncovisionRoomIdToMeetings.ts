import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOncovisionRoomIdToMeetings1781197041000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('meetings');
    if (table && !table.findColumnByName('oncovision_room_id')) {
      await queryRunner.addColumn(
        'meetings',
        new TableColumn({
          name: 'oncovision_room_id',
          type: 'text',
          isNullable: true,
          comment: 'Identifiant de la room OncoVision liée à cette réunion',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('meetings');
    if (table && table.findColumnByName('oncovision_room_id')) {
      await queryRunner.dropColumn('meetings', 'oncovision_room_id');
    }
  }
}

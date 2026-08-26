import { MigrationInterface, QueryRunner } from "typeorm";

export class Updated1787743358375 implements MigrationInterface {
    name = 'Updated1787743358375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" ADD "videoUrl" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "videoUrl"`);
    }

}

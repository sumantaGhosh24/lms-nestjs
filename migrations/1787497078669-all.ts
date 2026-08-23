import { MigrationInterface, QueryRunner } from "typeorm";

export class All1787497078669 implements MigrationInterface {
    name = 'All1787497078669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "description" text, "content" text, "thumbnail" character varying(500), "duration" integer NOT NULL DEFAULT '0', "order" integer NOT NULL, "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1bfae136ab53f4cbb13bd7d210" ON "lessons"  ("course_id", "order") `);
        await queryRunner.query(`CREATE TYPE "public"."enrollments_status_enum" AS ENUM('active', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "course_id" uuid NOT NULL, "status" "public"."enrollments_status_enum" NOT NULL DEFAULT 'active', "enrolledAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_647c6bda9ead37b702421710fde" UNIQUE ("user_id", "course_id"), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b79d0bf01779fdf9cfb6b092af" ON "enrollments"  ("course_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ff997f5a39cd24a491b9aca45c" ON "enrollments"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "slug" character varying(250) NOT NULL, "description" text, "thumbnail" character varying(500), "price" numeric(10,2) NOT NULL DEFAULT '0', "isPublished" boolean NOT NULL DEFAULT false, "created_by" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a3bb2d01cfa0f95bc5e034e1b7" ON "courses"  ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'instructor', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_16fcd8ab8bc042688984d5b3934" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_16fcd8ab8bc042688984d5b3934"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3bb2d01cfa0f95bc5e034e1b7"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff997f5a39cd24a491b9aca45c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b79d0bf01779fdf9cfb6b092af"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1bfae136ab53f4cbb13bd7d210"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
    }

}

import {defineConfig} from "prisma/config";
export default defineConfig({schema:"prisma/schema.prisma",datasource:{url:process.env.DATABASE_URL??"postgresql://localhost:5433/kcrown_demo"}});

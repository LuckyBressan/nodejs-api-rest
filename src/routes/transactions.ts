import type { FastifyInstance } from "fastify";
import { knex } from "../database";
import z from "zod";
import { randomUUID } from "crypto";
import checkSessionIdExists from "../middlewares/check-session-id-exists";

export default async function transactionsRoutes(app: FastifyInstance) {

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies;

      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();

      return { transactions };
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies;

      const getTransactionParamsSchema = z.object({
        id: z.uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(req.params);

      const transaction = await knex("transactions")
        .where({
          id,
          session_id: sessionId,
        })
        .first();

      return { transaction };
    }
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies;

      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first();

      return {
        summary,
      };
    }
  );

  app.post("/", async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(req.body);

    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      res.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    res.status(201).send();
  });
}

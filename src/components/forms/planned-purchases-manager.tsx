"use client";

import { useActionState, useState } from "react";
import { deletePlannedPurchaseAction, upsertPlannedPurchaseAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type Item = {
  id: string;
  linkedGoalId?: string;
  linkedGoalName?: string;
  seasonalityId?: string;
  seasonalityTitle?: string;
  title: string;
  categoryKey: string;
  priority: string;
  status: string;
  recommendation: string;
  targetPrice: number;
  expectedMinPrice?: number;
  expectedMaxPrice?: number;
  currentlySaved: number;
  desiredDate?: string;
  suggestedMonthlySaving?: number;
  bestMonthNote?: string;
  strategyNote?: string;
  preferredStores: string[];
  referenceSites: string[];
};

type Props = {
  items: Item[];
  goals: Array<{ id: string; name: string }>;
  seasonality: Array<{ id: string; title: string }>;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  linkedGoalId: "",
  seasonalityId: "",
  title: "",
  categoryKey: "",
  priority: "MEDIUM",
  status: "IDEA",
  recommendation: "WAIT",
  targetPrice: "",
  expectedMinPrice: "",
  expectedMaxPrice: "",
  currentlySaved: "0",
  desiredDate: "",
  suggestedMonthlySaving: "",
  bestMonthNote: "",
  strategyNote: "",
  preferredStores: "",
  referenceSites: ""
};

export function PlannedPurchasesManager({ items, goals, seasonality }: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertPlannedPurchaseAction, defaultState);

  function startEdit(item: Item) {
    setDraft({
      id: item.id,
      linkedGoalId: item.linkedGoalId ?? "",
      seasonalityId: item.seasonalityId ?? "",
      title: item.title,
      categoryKey: item.categoryKey,
      priority: item.priority,
      status: item.status,
      recommendation: item.recommendation,
      targetPrice: String(item.targetPrice),
      expectedMinPrice: item.expectedMinPrice ? String(item.expectedMinPrice) : "",
      expectedMaxPrice: item.expectedMaxPrice ? String(item.expectedMaxPrice) : "",
      currentlySaved: String(item.currentlySaved),
      desiredDate: item.desiredDate?.slice(0, 10) ?? "",
      suggestedMonthlySaving: item.suggestedMonthlySaving
        ? String(item.suggestedMonthlySaving)
        : "",
      bestMonthNote: item.bestMonthNote ?? "",
      strategyNote: item.strategyNote ?? "",
      preferredStores: item.preferredStores.join(", "),
      referenceSites: item.referenceSites.join(", ")
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Wishlist</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar compra planeada" : "Nueva compra planeada"}
            </h2>
          </div>
          {draft.id ? (
            <Button onClick={resetDraft} type="button" variant="secondary">
              Cancelar
            </Button>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4">
          <input name="id" type="hidden" value={draft.id} />
          <Input
            label="Producto o compra"
            name="title"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            value={draft.title}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Categoría base"
              name="categoryKey"
              onChange={(event) => setDraft((current) => ({ ...current, categoryKey: event.target.value }))}
              placeholder="smartphone, laptop, tv, vuelos"
              value={draft.categoryKey}
            />
            <Select
              label="Meta ligada"
              name="linkedGoalId"
              onChange={(event) => setDraft((current) => ({ ...current, linkedGoalId: event.target.value }))}
              value={draft.linkedGoalId}
            >
              <option value="">Sin meta ligada</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Select
              label="Prioridad"
              name="priority"
              onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
              value={draft.priority}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </Select>
            <Select
              label="Estado"
              name="status"
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              value={draft.status}
            >
              <option value="IDEA">Idea</option>
              <option value="RESEARCHING">Investigando</option>
              <option value="SAVING">Ahorrando</option>
              <option value="READY">Lista</option>
              <option value="BOUGHT">Comprada</option>
              <option value="SKIPPED">Descartada</option>
            </Select>
            <Select
              label="Recomendación"
              name="recommendation"
              onChange={(event) => setDraft((current) => ({ ...current, recommendation: event.target.value }))}
              value={draft.recommendation}
            >
              <option value="WAIT">Esperar</option>
              <option value="BUY_NOW">Comprar ya</option>
              <option value="SAVE_MORE">Ahorrar más</option>
              <option value="CONSIDER_MSI">Considerar MSI</option>
              <option value="AVOID">Evitar</option>
            </Select>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Precio meta"
              name="targetPrice"
              onChange={(event) => setDraft((current) => ({ ...current, targetPrice: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.targetPrice}
            />
            <Input
              label="Ahorro actual"
              name="currentlySaved"
              onChange={(event) => setDraft((current) => ({ ...current, currentlySaved: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.currentlySaved}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Precio mínimo esperado"
              name="expectedMinPrice"
              onChange={(event) => setDraft((current) => ({ ...current, expectedMinPrice: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.expectedMinPrice}
            />
            <Input
              label="Precio máximo esperado"
              name="expectedMaxPrice"
              onChange={(event) => setDraft((current) => ({ ...current, expectedMaxPrice: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.expectedMaxPrice}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Fecha deseada"
              name="desiredDate"
              onChange={(event) => setDraft((current) => ({ ...current, desiredDate: event.target.value }))}
              type="date"
              value={draft.desiredDate}
            />
            <Input
              label="Ahorro sugerido mensual"
              name="suggestedMonthlySaving"
              onChange={(event) =>
                setDraft((current) => ({ ...current, suggestedMonthlySaving: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.suggestedMonthlySaving}
            />
            <Select
              label="Seasonality"
              name="seasonalityId"
              onChange={(event) => setDraft((current) => ({ ...current, seasonalityId: event.target.value }))}
              value={draft.seasonalityId}
            >
              <option value="">Sin base de conocimiento</option>
              {seasonality.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Tiendas preferidas"
            name="preferredStores"
            onChange={(event) => setDraft((current) => ({ ...current, preferredStores: event.target.value }))}
            placeholder="Amazon, Liverpool, MacStore"
            value={draft.preferredStores}
          />
          <Input
            label="Sitios de referencia"
            name="referenceSites"
            onChange={(event) => setDraft((current) => ({ ...current, referenceSites: event.target.value }))}
            placeholder="promodescuentos.com, amazon.com.mx"
            value={draft.referenceSites}
          />
          <Textarea
            label="Mejor temporada estimada"
            name="bestMonthNote"
            onChange={(event) => setDraft((current) => ({ ...current, bestMonthNote: event.target.value }))}
            value={draft.bestMonthNote}
          />
          <Textarea
            label="Estrategia"
            name="strategyNote"
            onChange={(event) => setDraft((current) => ({ ...current, strategyNote: event.target.value }))}
            value={draft.strategyNote}
          />
          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {draft.id ? "Guardar compra" : "Crear compra planeada"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Lista activa</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Wishlist y estrategia</h2>
        </div>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.title}</p>
                    <p className="text-sm text-ink-muted">
                      {item.categoryKey} · {item.status}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(item.targetPrice)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.recommendation}</span>
                  <span>{item.linkedGoalName ?? "Sin meta"}</span>
                  {item.desiredDate ? <span>{formatDate(item.desiredDate, "d MMM yyyy")}</span> : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deletePlannedPurchaseAction}>
                    <input name="id" type="hidden" value={item.id} />
                    <Button type="submit" variant="secondary">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin compras planeadas" description="Crea wishlist con precio meta, temporada y estrategia antes de comprometer flujo." />
        )}
      </section>
    </div>
  );
}

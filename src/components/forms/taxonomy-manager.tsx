"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteCategoryAction,
  deleteSubcategoryAction,
  deleteTagAction,
  upsertCategoryAction,
  upsertSubcategoryAction,
  upsertTagAction
} from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ActionState } from "@/validations/finance";

type CategoryItem = {
  id: string;
  name: string;
  kind: string;
  color?: string;
  icon?: string;
  subcategoriesCount: number;
};

type SubcategoryItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

type TagItem = {
  id: string;
  name: string;
  color?: string;
};

type Props = {
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  tags: TagItem[];
};

const defaultState: ActionState = {};

export function TaxonomyManager({ categories, subcategories, tags }: Props) {
  const [categoryDraft, setCategoryDraft] = useState({
    id: "",
    name: "",
    kind: "EXPENSE",
    color: "",
    icon: ""
  });
  const [subcategoryDraft, setSubcategoryDraft] = useState({
    id: "",
    name: "",
    categoryId: categories[0]?.id ?? ""
  });
  const [tagDraft, setTagDraft] = useState({
    id: "",
    name: "",
    color: ""
  });

  const [categoryState, categoryAction] = useActionState(
    upsertCategoryAction,
    defaultState
  );
  const [subcategoryState, subcategoryAction] = useActionState(
    upsertSubcategoryAction,
    defaultState
  );
  const [tagState, tagAction] = useActionState(upsertTagAction, defaultState);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, name: category.name })),
    [categories]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <section className="glass-card rounded-[1.75rem] p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Categorías</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Personaliza el mapa financiero
            </h2>
          </div>
          {categoryDraft.id ? (
            <Button
              onClick={() => setCategoryDraft({ id: "", name: "", kind: "EXPENSE", color: "", icon: "" })}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
          ) : null}
        </div>

        <form action={categoryAction} className="space-y-4">
          <input name="id" type="hidden" value={categoryDraft.id} />
          <Input
            label="Nombre"
            name="name"
            onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))}
            value={categoryDraft.name}
          />
          <Select
            label="Tipo"
            name="kind"
            onChange={(event) => setCategoryDraft((current) => ({ ...current, kind: event.target.value }))}
            value={categoryDraft.kind}
          >
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Gasto</option>
            <option value="SAVINGS">Ahorro</option>
            <option value="DEBT">Deuda</option>
            <option value="TRANSFER">Transferencia</option>
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Color"
              name="color"
              onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}
              placeholder="#1098F7"
              value={categoryDraft.color}
            />
            <Input
              label="Icono"
              name="icon"
              onChange={(event) => setCategoryDraft((current) => ({ ...current, icon: event.target.value }))}
              placeholder="Nombre interno"
              value={categoryDraft.icon}
            />
          </div>
          {categoryState.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {categoryState.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {categoryDraft.id ? "Guardar categoría" : "Crear categoría"}
          </FormSubmitButton>
        </form>

        <div className="mt-6 space-y-3">
          {categories.length ? (
            categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{category.name}</p>
                    <p className="text-sm text-ink-muted">
                      {category.kind} · {category.subcategoriesCount} subcategorías
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        setCategoryDraft({
                          id: category.id,
                          name: category.name,
                          kind: category.kind,
                          color: category.color ?? "",
                          icon: category.icon ?? ""
                        })
                      }
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <form action={deleteCategoryAction}>
                      <input name="id" type="hidden" value={category.id} />
                      <Button type="submit" variant="secondary">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin categorías"
              description="Crea categorías personalizadas para adaptar la app a tu flujo real."
            />
          )}
        </div>
      </section>

      <section className="glass-card rounded-[1.75rem] p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Subcategorías</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Más detalle sin ruido
            </h2>
          </div>
          {subcategoryDraft.id ? (
            <Button
              onClick={() => setSubcategoryDraft({ id: "", name: "", categoryId: categories[0]?.id ?? "" })}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
          ) : null}
        </div>

        <form action={subcategoryAction} className="space-y-4">
          <input name="id" type="hidden" value={subcategoryDraft.id} />
          <Input
            label="Nombre"
            name="name"
            onChange={(event) => setSubcategoryDraft((current) => ({ ...current, name: event.target.value }))}
            value={subcategoryDraft.name}
          />
          <Select
            label="Categoría"
            name="categoryId"
            onChange={(event) => setSubcategoryDraft((current) => ({ ...current, categoryId: event.target.value }))}
            value={subcategoryDraft.categoryId}
          >
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {subcategoryState.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {subcategoryState.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {subcategoryDraft.id ? "Guardar subcategoría" : "Crear subcategoría"}
          </FormSubmitButton>
        </form>

        <div className="mt-6 space-y-3">
          {subcategories.length ? (
            subcategories.map((subcategory) => (
              <div key={subcategory.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{subcategory.name}</p>
                    <p className="text-sm text-ink-muted">{subcategory.categoryName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        setSubcategoryDraft({
                          id: subcategory.id,
                          name: subcategory.name,
                          categoryId: subcategory.categoryId
                        })
                      }
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <form action={deleteSubcategoryAction}>
                      <input name="id" type="hidden" value={subcategory.id} />
                      <Button type="submit" variant="secondary">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin subcategorías"
              description="Úsalas para separar mejor gasto variable, suscripciones o compras impulsivas."
            />
          )}
        </div>
      </section>

      <section className="glass-card rounded-[1.75rem] p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Etiquetas</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Contexto transversal
            </h2>
          </div>
          {tagDraft.id ? (
            <Button
              onClick={() => setTagDraft({ id: "", name: "", color: "" })}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
          ) : null}
        </div>

        <form action={tagAction} className="space-y-4">
          <input name="id" type="hidden" value={tagDraft.id} />
          <Input
            label="Nombre"
            name="name"
            onChange={(event) => setTagDraft((current) => ({ ...current, name: event.target.value }))}
            value={tagDraft.name}
          />
          <Input
            label="Color"
            name="color"
            onChange={(event) => setTagDraft((current) => ({ ...current, color: event.target.value }))}
            placeholder="#14C8B2"
            value={tagDraft.color}
          />
          {tagState.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {tagState.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {tagDraft.id ? "Guardar etiqueta" : "Crear etiqueta"}
          </FormSubmitButton>
        </form>

        <div className="mt-6 space-y-3">
          {tags.length ? (
            tags.map((tag) => (
              <div key={tag.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{tag.name}</p>
                    <p className="text-sm text-ink-muted">{tag.color ?? "Sin color"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setTagDraft({ id: tag.id, name: tag.name, color: tag.color ?? "" })}
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <form action={deleteTagAction}>
                      <input name="id" type="hidden" value={tag.id} />
                      <Button type="submit" variant="secondary">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin etiquetas"
              description="Agrupa compras por viaje, quincena, negocio o cualquier criterio propio."
            />
          )}
        </div>
      </section>
    </div>
  );
}

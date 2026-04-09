import { CategoryKind, Prisma, PrismaClient } from "@prisma/client";

const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  subcategories?: string[];
}> = [
  {
    name: "Nómina",
    kind: "INCOME",
    icon: "WalletCards",
    color: "#1098F7"
  },
  {
    name: "Freelance",
    kind: "INCOME",
    icon: "BriefcaseBusiness",
    color: "#14C8B2"
  },
  {
    name: "Vivienda",
    kind: "EXPENSE",
    icon: "House",
    color: "#2563EB",
    subcategories: ["Renta", "Hipoteca", "Mantenimiento"]
  },
  {
    name: "Comida",
    kind: "EXPENSE",
    icon: "UtensilsCrossed",
    color: "#0EA5A4",
    subcategories: ["Restaurantes", "Cafeterías", "Delivery"]
  },
  {
    name: "Despensa",
    kind: "EXPENSE",
    icon: "ShoppingBasket",
    color: "#14C8B2",
    subcategories: ["Supermercado", "Club de precios"]
  },
  {
    name: "Suscripciones",
    kind: "EXPENSE",
    icon: "BadgeDollarSign",
    color: "#64748B",
    subcategories: ["Streaming", "Cloud", "Apps"]
  },
  {
    name: "Transporte",
    kind: "EXPENSE",
    icon: "CarFront",
    color: "#3B82F6",
    subcategories: ["Gasolina", "Uber / Taxi", "Estacionamiento"]
  },
  {
    name: "Servicios",
    kind: "EXPENSE",
    icon: "ReceiptText",
    color: "#38BDF8",
    subcategories: ["Luz", "Internet", "Agua", "Telefonía"]
  },
  {
    name: "Salud",
    kind: "EXPENSE",
    icon: "HeartPulse",
    color: "#F25F5C",
    subcategories: ["Farmacia", "Consulta", "Seguro médico"]
  },
  {
    name: "Entretenimiento",
    kind: "EXPENSE",
    icon: "Film",
    color: "#60A5FA",
    subcategories: ["Cine", "Eventos", "Videojuegos"]
  },
  {
    name: "Educación",
    kind: "EXPENSE",
    icon: "GraduationCap",
    color: "#0F766E",
    subcategories: ["Cursos", "Libros", "Plataformas"]
  },
  {
    name: "Seguros",
    kind: "EXPENSE",
    icon: "ShieldCheck",
    color: "#1D4ED8",
    subcategories: ["Auto", "Salud", "Vida"]
  },
  {
    name: "MSI",
    kind: "DEBT",
    icon: "CalendarSync",
    color: "#F25F5C",
    subcategories: ["Tecnología", "Hogar", "Viajes"]
  },
  {
    name: "Pago de deuda",
    kind: "DEBT",
    icon: "Landmark",
    color: "#0F172A",
    subcategories: ["Tarjeta", "Préstamo personal"]
  },
  {
    name: "Ahorro",
    kind: "SAVINGS",
    icon: "PiggyBank",
    color: "#14C8B2",
    subcategories: ["Fondo de emergencia", "Compra planeada", "Seguro anual"]
  }
];

const DEFAULT_TAGS = [
  { name: "Fijo", color: "#1098F7" },
  { name: "Planeado", color: "#64748B" },
  { name: "Impulso", color: "#F25F5C" },
  { name: "Quincena", color: "#14C8B2" }
];

type DefaultsDb = PrismaClient | Prisma.TransactionClient;

export async function ensureUserFinancialDefaults(db: DefaultsDb, userId: string) {
  const [existingCategories, existingTags] = await Promise.all([
    db.category.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true }
    }),
    db.tag.findMany({
      where: { userId },
      select: { name: true }
    })
  ]);

  const categoryMap = new Map(
    existingCategories.map((category) => [`${category.kind}:${category.name}`, category.id])
  );

  for (const category of DEFAULT_CATEGORIES) {
    const key = `${category.kind}:${category.name}`;

    if (!categoryMap.has(key)) {
      const created = await db.category.upsert({
        where: {
          userId_name_kind: {
            userId,
            name: category.name,
            kind: category.kind
          }
        },
        update: {},
        create: {
          userId,
          name: category.name,
          kind: category.kind,
          icon: category.icon,
          color: category.color,
          isSystem: true
        },
        select: { id: true }
      });

      categoryMap.set(key, created.id);
    }
  }

  const categoryIds = Array.from(categoryMap.values());
  const existingSubcategories = await db.subcategory.findMany({
    where: {
      userId,
      categoryId: {
        in: categoryIds
      }
    },
    select: { categoryId: true, name: true }
  });

  const subcategorySet = new Set(
    existingSubcategories.map((subcategory) => `${subcategory.categoryId}:${subcategory.name}`)
  );

  for (const category of DEFAULT_CATEGORIES) {
    const categoryId = categoryMap.get(`${category.kind}:${category.name}`);
    if (!categoryId || !category.subcategories?.length) {
      continue;
    }

    for (const subcategoryName of category.subcategories) {
      const key = `${categoryId}:${subcategoryName}`;

      if (subcategorySet.has(key)) {
        continue;
      }

      await db.subcategory.upsert({
        where: {
          categoryId_name: {
            categoryId,
            name: subcategoryName
          }
        },
        update: {},
        create: {
          userId,
          categoryId,
          name: subcategoryName
        }
      });

      subcategorySet.add(key);
    }
  }

  const tagSet = new Set(existingTags.map((tag) => tag.name));

  for (const tag of DEFAULT_TAGS) {
    if (tagSet.has(tag.name)) {
      continue;
    }

    await db.tag.upsert({
      where: {
        userId_name: {
          userId,
          name: tag.name
        }
      },
      update: {},
      create: {
        userId,
        name: tag.name,
        color: tag.color
      }
    });
  }
}

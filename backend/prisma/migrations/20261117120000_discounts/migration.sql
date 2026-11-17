-- CreateTable
CREATE TABLE "Discount" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textEn" TEXT NOT NULL DEFAULT '',
    "textBe" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- Начальные карточки со скриншота, дальше меняются в панели администратора
INSERT INTO "Discount" ("value", "textRu", "textEn", "textBe", "sortOrder", "updatedAt") VALUES
('5%', 'постоянным клиентам (3+ заселений)', 'for regular guests (3+ stays)', 'пастаянным кліентам (3+ засяленняў)', 1, CURRENT_TIMESTAMP),
('10%', 'организованным группам', 'for organized groups', 'арганізаваным групам', 2, CURRENT_TIMESTAMP),
('5%', 'при длительном проживании', 'for long stays', 'пры працяглым пражыванні', 3, CURRENT_TIMESTAMP),
('10%', 'льготным категориям граждан', 'for eligible categories of citizens', 'льготным катэгорыям грамадзян', 4, CURRENT_TIMESTAMP);

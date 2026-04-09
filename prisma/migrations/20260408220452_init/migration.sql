-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DebtStrategy" AS ENUM ('SNOWBALL', 'AVALANCHE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'DEBIT', 'SAVINGS', 'CASH', 'INVESTMENT', 'CREDIT_CARD', 'LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "CardPaymentTracking" AS ENUM ('MINIMUM', 'FULL_STATEMENT', 'BOTH');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE', 'SAVINGS', 'DEBT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'CREDIT_CARD_PAYMENT', 'LOAN_PAYMENT', 'SAVINGS_CONTRIBUTION', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionCadence" AS ENUM ('ONE_TIME', 'RECURRING', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "TransactionPlanning" AS ENUM ('PLANNED', 'UNPLANNED');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAID_OFF', 'EARLY_SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BudgetScope" AS ENUM ('GLOBAL', 'CATEGORY', 'SUBCATEGORY');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('THRESHOLD', 'TREND', 'ACCUMULATION', 'CONCENTRATION', 'RISK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL', 'POSITIVE');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('ACTIVE', 'DISMISSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlannedPurchaseStatus" AS ENUM ('IDEA', 'RESEARCHING', 'SAVING', 'READY', 'BOUGHT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('WAIT', 'BUY_NOW', 'SAVE_MORE', 'CONSIDER_MSI', 'AVOID');

-- CreateEnum
CREATE TYPE "SeasonalityStrength" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'BUDGET_WARNING', 'GOAL_RISK', 'MSI_ALERT', 'INSIGHT', 'GENERIC');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "locale" TEXT NOT NULL DEFAULT 'es-MX',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "incomeFrequency" "IncomeFrequency" NOT NULL DEFAULT 'BIWEEKLY',
    "paydayDays" INTEGER[] DEFAULT ARRAY[15, 30]::INTEGER[],
    "debtStrategy" "DebtStrategy" NOT NULL DEFAULT 'AVALANCHE',
    "defaultGoalPriority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "cardStatementBufferDays" INTEGER NOT NULL DEFAULT 3,
    "enableLocalInsights" BOOLEAN NOT NULL DEFAULT true,
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "projectedFlowMonths" INTEGER NOT NULL DEFAULT 12,
    "categoryBudgetWarningPct" INTEGER NOT NULL DEFAULT 80,
    "themeMode" TEXT NOT NULL DEFAULT 'light',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "institution" TEXT,
    "last4" TEXT,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "availableBalance" DECIMAL(12,2),
    "creditLimit" DECIMAL(12,2),
    "color" TEXT,
    "icon" TEXT,
    "includeInNetWorth" BOOLEAN NOT NULL DEFAULT true,
    "isLiquid" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "statementClosingDay" INTEGER NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "creditLimit" DECIMAL(12,2) NOT NULL,
    "annualInterestRate" DECIMAL(5,2),
    "minimumPaymentRatio" DECIMAL(5,2),
    "paymentTracking" "CardPaymentTracking" NOT NULL DEFAULT 'BOTH',
    "statementBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payoffBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "nextStatementDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "color" TEXT,
    "icon" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lender" TEXT,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "monthlyPayment" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,2),
    "paymentDay" INTEGER NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "strategyWeight" INTEGER NOT NULL DEFAULT 50,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetPayoffDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "type" "TransactionType" NOT NULL,
    "cadence" "TransactionCadence" NOT NULL DEFAULT 'ONE_TIME',
    "planning" "TransactionPlanning" NOT NULL DEFAULT 'UNPLANNED',
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "notes" TEXT,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "sourceAccountId" TEXT,
    "destinationAccountId" TEXT,
    "savingsGoalId" TEXT,
    "recurringExpenseId" TEXT,
    "installmentPurchaseId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTag" (
    "transactionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TransactionTag_pkey" PRIMARY KEY ("transactionId","tagId")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "isEssential" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "merchant" TEXT,
    "notes" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "paymentAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "merchant" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "totalMonths" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(12,2) NOT NULL,
    "firstChargeMonth" TIMESTAMP(3) NOT NULL,
    "currentInstallment" INTEGER NOT NULL DEFAULT 1,
    "remainingBalance" DECIMAL(12,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isManuallySettled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallmentPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPayment" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "chargeMonth" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "remainingAfterPayment" DECIMAL(12,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkedAccountId" TEXT,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "currentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "monthlySuggestedContribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "color" TEXT,
    "icon" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "scope" "BudgetScope" NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "limitAmount" DECIMAL(12,2) NOT NULL,
    "alertPercent" INTEGER NOT NULL DEFAULT 80,
    "carryOver" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'INFO',
    "config" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT,
    "categoryId" TEXT,
    "installmentPurchaseId" TEXT,
    "plannedPurchaseId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SpendingInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkedGoalId" TEXT,
    "seasonalityId" TEXT,
    "title" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "PlannedPurchaseStatus" NOT NULL DEFAULT 'IDEA',
    "recommendation" "RecommendationType" NOT NULL DEFAULT 'WAIT',
    "targetPrice" DECIMAL(12,2),
    "expectedMinPrice" DECIMAL(12,2),
    "expectedMaxPrice" DECIMAL(12,2),
    "currentlySaved" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desiredDate" TIMESTAMP(3),
    "suggestedMonthlySaving" DECIMAL(12,2),
    "bestMonthNote" TEXT,
    "strategyNote" TEXT,
    "preferredStores" TEXT[],
    "referenceSites" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseSeasonality" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "bestMonths" INTEGER[],
    "secondaryMonths" INTEGER[],
    "typicalRetailers" TEXT[],
    "recommendedSites" TEXT[],
    "priceRangeMin" DECIMAL(12,2),
    "priceRangeMax" DECIMAL(12,2),
    "guidance" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 70,
    "strength" "SeasonalityStrength" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseSeasonality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "scheduledFor" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_type_idx" ON "Account"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCard_accountId_key" ON "CreditCard"("accountId");

-- CreateIndex
CREATE INDEX "CreditCard_userId_nextDueDate_idx" ON "CreditCard"("userId", "nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_accountId_key" ON "Loan"("accountId");

-- CreateIndex
CREATE INDEX "Loan_userId_priority_idx" ON "Loan"("userId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_kind_key" ON "Category"("userId", "name", "kind");

-- CreateIndex
CREATE INDEX "Subcategory_userId_categoryId_idx" ON "Subcategory"("userId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "Transaction_userId_postedAt_type_idx" ON "Transaction"("userId", "postedAt", "type");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_subcategoryId_idx" ON "Transaction"("categoryId", "subcategoryId");

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_nextDueDate_isActive_idx" ON "RecurringExpense"("userId", "nextDueDate", "isActive");

-- CreateIndex
CREATE INDEX "InstallmentPurchase_userId_status_firstChargeMonth_idx" ON "InstallmentPurchase"("userId", "status", "firstChargeMonth");

-- CreateIndex
CREATE INDEX "InstallmentPayment_chargeMonth_dueDate_idx" ON "InstallmentPayment"("chargeMonth", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPayment_purchaseId_installmentNumber_key" ON "InstallmentPayment"("purchaseId", "installmentNumber");

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_priority_idx" ON "SavingsGoal"("userId", "priority");

-- CreateIndex
CREATE INDEX "Budget_userId_month_scope_idx" ON "Budget"("userId", "month", "scope");

-- CreateIndex
CREATE INDEX "FinancialRule_userId_isEnabled_idx" ON "FinancialRule"("userId", "isEnabled");

-- CreateIndex
CREATE INDEX "SpendingInsight_userId_status_severity_idx" ON "SpendingInsight"("userId", "status", "severity");

-- CreateIndex
CREATE INDEX "PlannedPurchase_userId_status_priority_idx" ON "PlannedPurchase"("userId", "status", "priority");

-- CreateIndex
CREATE INDEX "PurchaseSeasonality_userId_categoryKey_idx" ON "PurchaseSeasonality"("userId", "categoryKey");

-- CreateIndex
CREATE INDEX "Notification_userId_status_scheduledFor_idx" ON "Notification"("userId", "status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "SavingsGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_installmentPurchaseId_fkey" FOREIGN KEY ("installmentPurchaseId") REFERENCES "InstallmentPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "InstallmentPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRule" ADD CONSTRAINT "FinancialRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "FinancialRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_installmentPurchaseId_fkey" FOREIGN KEY ("installmentPurchaseId") REFERENCES "InstallmentPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingInsight" ADD CONSTRAINT "SpendingInsight_plannedPurchaseId_fkey" FOREIGN KEY ("plannedPurchaseId") REFERENCES "PlannedPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedPurchase" ADD CONSTRAINT "PlannedPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedPurchase" ADD CONSTRAINT "PlannedPurchase_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "SavingsGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedPurchase" ADD CONSTRAINT "PlannedPurchase_seasonalityId_fkey" FOREIGN KEY ("seasonalityId") REFERENCES "PurchaseSeasonality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseSeasonality" ADD CONSTRAINT "PurchaseSeasonality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

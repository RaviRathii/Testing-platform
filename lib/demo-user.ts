import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@mocktest.local";

export async function getDemoUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Demo Learner",
        email: DEMO_EMAIL,
      },
    });
  }

  return user;
}

export async function getDemoSubscription() {
  const user = await getDemoUser();

  let subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        startsAt: new Date(),
      },
    });
  }

  return { user, subscription };
}

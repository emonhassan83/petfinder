import express from "express";
import { userRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { petRoutes } from "../modules/pet/pet.routes";
import { adoptionRequestRoutes } from "../modules/AdoptionRequest/adoption.routes";
import { blogRoutes } from "../modules/blog/blog.routes";
import { commentRoutes } from "../modules/comment/comment.routes";
import { donateRoutes } from "../modules/donate/donate.routes";
import { MetaRoutes } from "../modules/Meta/meta.routes";
import { shelterRoutes } from "../modules/shelter/shelter.routes";
import { mediaRoutes } from "../modules/media/media.routes";
import { favoriteRoutes } from "../modules/favorite/favorite.routes";
import { conversationRoutes } from "../modules/conversation/conversation.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";
import { reportRoutes } from "../modules/report/report.routes";
import { reviewRoutes, shelterReviewRoutes } from "../modules/review/review.routes";
import { planRoutes } from "../modules/plan/plan.routes";
import { adminBillingRoutes, subscriptionRoutes } from "../modules/subscription/subscription.routes";
import { webhookRoutes } from "../modules/webhook/webhook.routes";
import { lookupRoutes } from "../modules/lookup/lookup.routes";
import { cmsRoutes } from "../modules/cms/cms.routes";
import { settingRoutes } from "../modules/setting/setting.routes";
import { auditLogRoutes } from "../modules/auditLog/auditLog.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { petVisitSlotRoutes, shelterVisitSlotRoutes, visitRoutes } from "../modules/visit/visit.routes";
import { petFeeRoutes } from "../modules/petFee/petFee.routes";
import { successStoryRoutes } from "../modules/successStory/successStory.routes";

const router = express.Router();

//* Order matters only where modules share a prefix: more specific sub-routers come first.
//* Routers sharing a prefix (/pets, /shelters, /admin) must put auth() on each route, not router.use(auth()).
const moduleRoutes = [
  { path: "/user", route: userRoutes },
  { path: "/auth", route: AuthRoutes },
  //* /pets: fees and visit slots are pet sub-resources owned by B3f
  { path: "/pets", route: petFeeRoutes },
  { path: "/pets", route: petVisitSlotRoutes },
  { path: "/pets", route: petRoutes },
  { path: "/adoption-requests", route: adoptionRequestRoutes },
  { path: "/blog", route: blogRoutes },
  { path: "/comment", route: commentRoutes },
  { path: "/donate", route: donateRoutes },
  { path: "/meta", route: MetaRoutes },
  //* /shelters: reviews (B3c) and visit slots (B3f) before the shelter module (B3b)
  { path: "/shelters", route: shelterReviewRoutes },
  { path: "/shelters", route: shelterVisitSlotRoutes },
  { path: "/shelters", route: shelterRoutes },
  { path: "/media", route: mediaRoutes },
  { path: "/favorites", route: favoriteRoutes },
  { path: "/conversations", route: conversationRoutes },
  { path: "/notifications", route: notificationRoutes },
  { path: "/reports", route: reportRoutes },
  { path: "/reviews", route: reviewRoutes },
  { path: "/plans", route: planRoutes },
  { path: "/subscriptions", route: subscriptionRoutes },
  { path: "/webhooks", route: webhookRoutes },
  { path: "/lookups", route: lookupRoutes },
  { path: "/cms", route: cmsRoutes },
  { path: "/settings", route: settingRoutes },
  //* /admin: audit logs (B3e) and billing views (B3d) before the admin module (B3e)
  { path: "/admin/audit-logs", route: auditLogRoutes },
  { path: "/admin", route: adminBillingRoutes },
  { path: "/admin", route: adminRoutes },
  { path: "/visits", route: visitRoutes },
  { path: "/success-stories", route: successStoryRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

import { mysqlTable, int, varchar, timestamp, boolean, text, mysqlEnum, decimal, json, index, uniqueIndex, foreignKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  rutTin: varchar('rut_tin', { length: 20 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  phoneOtp: varchar('phone_otp', { length: 10 }),
  phoneOtpExpiresAt: timestamp('phone_otp_expires_at'),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  roleId: varchar('role_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }),
  planExpiresAt: timestamp('plan_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  companyName: varchar('company_name', { length: 255 }),
  mainOperatingRegion: varchar('main_operating_region', { length: 100 }),
  mainOperatingCommune: varchar('main_operating_commune', { length: 100 }),
  propertiesInPortfolioCount: int('properties_in_portfolio_count'),
  websiteSocialMediaLink: varchar('website_social_media_link', { length: 2048 }),
  primaryGroupId: varchar('primary_group_id', { length: 255 }),
});

export const groups = mysqlTable('groups', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  ownerId: varchar('owner_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postBadgeType: mysqlEnum('post_badge_type', ['logo', 'name', 'none']).notNull().default('none'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => {
  return {
    ownerIdx: index('owner_idx').on(table.ownerId),
  };
});

export const groupMembers = mysqlTable('group_members', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  groupId: varchar('group_id', { length: 255 }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: mysqlEnum('role', ['admin', 'member']).notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => {
  return {
    groupMemberIdx: uniqueIndex('group_member_idx').on(table.groupId, table.userId),
    groupIdx: index('group_idx').on(table.groupId),
    userIdx: index('user_idx').on(table.userId),
  };
});

export const usersPrimaryGroupFk = foreignKey({
  columns: [users.primaryGroupId],
  foreignColumns: [groups.id],
  name: 'users_primary_group_id_fk',
}).onDelete('set null');

export const properties = mysqlTable('properties', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  source: mysqlEnum('source', ['web', 'bot']).default('web').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  propertyType: mysqlEnum('property_type', ['rent', 'sale']).notNull(),
  category: mysqlEnum('category', ['apartment', 'house', 'condo', 'land', 'commercial', 'other']).notNull(),
  price: decimal('price', { precision: 14, scale: 2 }),
  currency: varchar('currency', { length: 10 }),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  region: varchar('region', { length: 100 }),
  bedrooms: int('bedrooms'),
  bathrooms: int('bathrooms'),
  totalAreaSqMeters: decimal('total_area_sq_meters', { precision: 10, scale: 2 }),
  usefulAreaSqMeters: decimal('useful_area_sq_meters', { precision: 10, scale: 2 }),
  parkingSpaces: int('parking_spaces'),
  petsAllowed: boolean('pets_allowed'),
  furnished: boolean('furnished'),
  commercialUseAllowed: boolean('commercial_use_allowed'),
  hasStorage: boolean('has_storage'),
  orientation: varchar('orientation', { length: 255 }),
  images: json('images'),
  features: json('features'),
  upvotes: int('upvotes').default(0),
  commentsCount: int('comments_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  viewsCount: int('views_count').default(0),
  inquiriesCount: int('inquiries_count').default(0),
  publicationCode: varchar('publication_code', { length: 255 }),
});

export const searchRequests = mysqlTable('property_requests', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  desiredPropertyTypeRent: boolean('desired_property_type_rent'),
  desiredPropertyTypeSale: boolean('desired_property_type_sale'),
  desiredCategoryApartment: boolean('desired_category_apartment'),
  desiredCategoryHouse: boolean('desired_category_house'),
  desiredCategoryCondo: boolean('desired_category_condo'),
  desiredCategoryLand: boolean('desired_category_land'),
  desiredCategoryCommercial: boolean('desired_category_commercial'),
  desiredCategoryOther: boolean('desired_category_other'),
  desiredLocationCity: varchar('desired_location_city', { length: 255 }),
  desiredLocationRegion: varchar('desired_location_region', { length: 255 }),
  desiredLocationNeighborhood: varchar('desired_location_neighborhood', { length: 255 }),
  minBedrooms: int('min_bedrooms'),
  minBathrooms: int('min_bathrooms'),
  budgetMax: decimal('budget_max', { precision: 14, scale: 2 }),
  commentsCount: int('comments_count').default(0),
  upvotes: int('upvotes').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
  openForBrokerCollaboration: boolean('open_for_broker_collaboration').default(false),
  publicationCode: varchar('publication_code', { length: 255 }),
});

export const plans = mysqlTable('plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price_monthly: decimal('price_monthly', { precision: 10, scale: 2 }).default('0.00'),
  price_currency: varchar('price_currency', { length: 3 }).default('CLP'),
  max_properties_allowed: int('max_properties_allowed'),
  max_requests_allowed: int('max_requests_allowed'),
  max_ai_searches_monthly: int('max_ai_searches_monthly'),
  can_view_contact_data: boolean('can_view_contact_data').default(false),
  manual_searches_daily_limit: int('manual_searches_daily_limit'),
  automated_alerts_enabled: boolean('automated_alerts_enabled').default(false),
  advanced_dashboard_access: boolean('advanced_dashboard_access').default(false),
  daily_profile_views_limit: int('daily_profile_views_limit'),
  weekly_matches_reveal_limit: int('weekly_matches_reveal_limit'),
  can_feature_properties: boolean('can_feature_properties').default(false),
  property_listing_duration_days: int('property_listing_duration_days'),
  is_active: boolean('is_active').default(true),
  is_publicly_visible: boolean('is_publicly_visible').default(true),
  is_enterprise_plan: boolean('is_enterprise_plan').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').onUpdateNow(),
}, (table) => {
    return {
        nameIdx: uniqueIndex('name_idx').on(table.name),
    };
});

export const roles = mysqlTable('roles', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    permissions: text('permissions'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').onUpdateNow(),
}, (table) => {
    return {
        nameIdx: uniqueIndex('roles_name_unique').on(table.name),
    };
});

export const permissions = mysqlTable('permissions', {
    id: int('id').primaryKey(),
    name: varchar('name', { length: 255 }),
});

export const contacts = mysqlTable('contacts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceUserId: varchar('source_user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  companyName: varchar('company_name', { length: 255 }),
  status: mysqlEnum('status', ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold', 'unqualified']).default('new').notNull(),
  source: varchar('source', { length: 255 }),
  notes: text('notes'),
  lastContactedAt: timestamp('last_contacted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow().notNull(),
});

export const comments = mysqlTable('comments', {
    id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
    content: text('content').notNull(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    propertyId: varchar('property_id', { length: 255 }).references(() => properties.id, { onDelete: 'cascade' }),
    requestId: varchar('request_id', { length: 255 }).references(() => searchRequests.id, { onDelete: 'cascade' }),
    parentId: varchar('parent_id', { length: 255 }),
    upvotes: int('upvotes').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
    userIdx: index('user_idx').on(table.userId),
    propertyIdx: index('property_idx').on(table.propertyId),
    requestIdx: index('request_idx').on(table.requestId),
    parentIdx: index('parent_idx').on(table.parentId),
}));

export const bugReports = mysqlTable('bug_reports', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  page_url: varchar('page_url', { length: 2048 }),
  description: text('description').notNull(),
  steps_to_reproduce: text('steps_to_reproduce'),
  browser_device: varchar('browser_device', { length: 255 }),
  user_id: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  status: mysqlEnum('status', ['new', 'in_review', 'in_progress', 'fixed', 'wont_fix', 'duplicate', 'cannot_reproduce']).default('new'),
  admin_notes: text('admin_notes'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').onUpdateNow(),
}, (table) => {
    return {
        statusIdx: index('idx_bug_reports_status').on(table.status),
        userIdx: index('idx_bug_reports_user_id').on(table.user_id),
        isReadIdx: index('idx_bug_reports_is_read').on(table.is_read),
    };
});

export const sessions = mysqlTable('sessions', {
  token: varchar('token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const propertyViewings = mysqlTable('property_viewings', {
    id: varchar('id', { length: 36 }).primaryKey(),
    propertyId: varchar('property_id', { length: 255 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
    visitorId: varchar('visitor_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    ownerId: varchar('owner_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    proposedDatetime: timestamp('proposed_datetime').notNull(),
    confirmedDatetime: timestamp('confirmed_datetime'),
    status: mysqlEnum('status', ['pending_confirmation', 'confirmed', 'cancelled_by_visitor', 'cancelled_by_owner', 'rescheduled_by_owner', 'completed', 'visitor_no_show', 'owner_no_show']).default('pending_confirmation').notNull(),
    visitorNotes: text('visitor_notes'),
    ownerNotes: text('owner_notes'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').onUpdateNow().notNull(),
    createdByAdmin: boolean('created_by_admin').default(false),
}, (table) => {
    return {
        propertyIdx: index('property_idx').on(table.propertyId),
        visitorIdx: index('visitor_idx').on(table.visitorId),
        ownerIdx: index('owner_idx').on(table.ownerId),
        statusIdx: index('status_idx').on(table.status),
    };
});

export const siteSettings = mysqlTable('site_settings', {
  id: int('id').primaryKey().autoincrement(),
  site_title: varchar('site_title', { length: 255 }),
  logo_url: varchar('logo_url', { length: 2048 }),
  show_featured_listings_section: boolean('show_featured_listings_section').default(true),
  show_ai_matching_section: boolean('show_ai_matching_section').default(true),
  show_google_sheet_section: boolean('show_google_sheet_section').default(false),
  show_featured_plans_section: boolean('show_featured_plans_section').default(true),
  landing_sections_order: json('landing_sections_order'),
  announcement_bar_text: varchar('announcement_bar_text', { length: 500 }),
  announcement_bar_link_url: varchar('announcement_bar_link_url', { length: 2048 }),
  announcement_bar_link_text: varchar('announcement_bar_link_text', { length: 100 }),
  announcement_bar_is_active: boolean('announcement_bar_is_active').default(false),
  announcement_bar_bg_color: varchar('announcement_bar_bg_color', { length: 7 }),
  announcement_bar_text_color: varchar('announcement_bar_text_color', { length: 7 }),
  updated_at: timestamp('updated_at').onUpdateNow(),
});

export const editableTexts = mysqlTable('editable_texts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  pageGroup: varchar('page_group', { length: 255 }),
  description: text('description'),
  contentDefault: text('content_default').notNull(),
  contentCurrent: text('content_current').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
}, (table) => ({
  pageGroupIdx: index('idx_editable_texts_page_group').on(table.pageGroup),
}));

export const googleSheetConfigs = mysqlTable('google_sheet_configs', {
    id: int('id').primaryKey().default(1),
    sheetId: varchar('sheet_id', { length: 255 }),
    sheetName: varchar('sheet_name', { length: 255 }),
    columnsToDisplay: text('columns_to_display'),
    isConfigured: boolean('is_configured').default(false),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const propertyViews = mysqlTable('property_views', {
    id: varchar('id', { length: 36 }).primaryKey(),
    propertyId: varchar('property_id', { length: 36 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    viewedAt: timestamp('viewed_at').defaultNow(),
});

export const propertyInquiries = mysqlTable('property_inquiries', {
    id: varchar('id', { length: 36 }).primaryKey(),
    propertyId: varchar('property_id', { length: 36 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
    propertyOwnerId: varchar('property_owner_id', { length: 36 }).notNull().references(() => users.id),
    userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    message: text('message').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow(),
    isRead: boolean('is_read').default(false),
});

export const userListingInteractions = mysqlTable('user_listing_interactions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    listingId: varchar('listing_id', { length: 36 }).notNull(),
    listingType: mysqlEnum('listing_type', ['property', 'request']).notNull(),
    interactionType: mysqlEnum('interaction_type', ['like', 'dislike', 'skip']).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        userListingInteractionIdx: uniqueIndex('uq_user_listing_interaction').on(table.userId, table.listingId, table.listingType),
    };
});

export const userCommentInteractions = mysqlTable('user_comment_interactions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    commentId: varchar('comment_id', { length: 36 }).notNull(),
    interactionType: mysqlEnum('interaction_type', ['like']).notNull(),
}, (table) => {
    return {
        userCommentInteractionIdx: uniqueIndex('uq_user_comment_interaction').on(table.userId, table.commentId),
    };
});

export const chatConversations = mysqlTable("chat_conversations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  propertyId: varchar("property_id", { length: 36 }),
  requestId: varchar("request_id", { length: 36 }),
  userAId: varchar("user_a_id", { length: 36 }).notNull(),
  userBId: varchar("user_b_id", { length: 36 }).notNull(),
  userAUnreadCount: int("user_a_unread_count").notNull().default(0),
  userBUnreadCount: int("user_b_unread_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 36 }).notNull(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  receiverId: varchar("receiver_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const aiMatches = mysqlTable("ai_matches", {
    id: varchar("id", { length: 36 }).primaryKey(),
    property_id: varchar("property_id", { length: 36 }).notNull(),
    request_id: varchar("request_id", { length: 36 }).notNull(),
    match_score: decimal("match_score", { precision: 5, scale: 4 }).notNull(),
    reason: text("reason"),
    last_calculated_at: timestamp("last_calculated_at").defaultNow().onUpdateNow(),
    status: mysqlEnum("status", ['pending', 'accepted', 'rejected', 'closed_won', 'closed_lost']).default('pending').notNull(),
    commission_terms: text("commission_terms"),
    chat_conversation_id: varchar("chat_conversation_id", { length: 36 }),
    proposed_at: timestamp("proposed_at").defaultNow(),
    accepted_at: timestamp("accepted_at"),
    closed_at: timestamp("closed_at"),
    updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const brokerCollaborations = mysqlTable("broker_collaborations", {
    id: varchar("id", { length: 36 }).primaryKey(),
    property_request_id: varchar("property_request_id", { length: 36 }).notNull(),
    requesting_broker_id: varchar("requesting_broker_id", { length: 36 }).notNull(),
    property_id: varchar("property_id", { length: 36 }).notNull(),
    offering_broker_id: varchar("offering_broker_id", { length: 36 }).notNull(),
    status: mysqlEnum("status", ['pending', 'accepted', 'rejected', 'closed_won', 'closed_lost']).default('pending').notNull(),
    commission_terms: text("commission_terms"),
    chat_conversation_id: varchar("chat_conversation_id", { length: 36 }),
    proposed_at: timestamp("proposed_at").defaultNow(),
    accepted_at: timestamp("accepted_at"),
    closed_at: timestamp("closed_at"),
    updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const whatsappMessages = mysqlTable('whatsapp_messages', {
    id: int('id').autoincrement().primaryKey(),
    telefono: varchar('telefono', { length: 255 }).notNull(),
    text: text('text').notNull(),
    sender: varchar('sender', { length: 50 }).notNull(), // 'user' or 'bot'
    timestamp: timestamp('timestamp').defaultNow(),
    status: varchar('status', { length: 50 }),
    senderIdOverride: varchar('sender_id_override', { length: 255 }),
}, (table) => ({
    telefonoIdx: index('telefono_idx').on(table.telefono),
}));

export const contactFormSubmissions = mysqlTable('contact_form_submissions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    subject: varchar('subject', { length: 255 }),
    message: text('message').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow(),
    isRead: boolean('is_read').default(false),
    adminNotes: text('admin_notes'),
    repliedAt: timestamp('replied_at'),
}, (table) => {
    return {
        submittedAtIdx: index('idx_contact_submissions_submitted_at').on(table.submittedAt),
        isReadIdx: index('idx_contact_submissions_is_read').on(table.isRead),
    };
});

export const contactInteractions = mysqlTable('contact_interactions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    contactId: varchar('contact_id', { length: 36 }).notNull().references(() => contacts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    interactionType: mysqlEnum('interaction_type', ['note', 'email_sent', 'email_received', 'call_made', 'call_received', 'meeting', 'message_sent', 'message_received', 'task_completed', 'property_viewing', 'offer_made', 'other']).notNull(),
    interactionDate: timestamp('interaction_date').defaultNow(),
    subject: varchar('subject', { length: 255 }),
    description: text('description').notNull(),
    outcome: varchar('outcome', { length: 255 }),
    followUpNeeded: boolean('follow_up_needed').default(false),
    followUpDate: timestamp('follow_up_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').onUpdateNow(),
}, (table) => {
    return {
        contactIdDateIdx: index('idx_interactions_contact_id_date').on(table.contactId, table.interactionDate),
        userIdx: index('idx_interactions_user_id').on(table.userId),
        followUpDateIdx: index('idx_interactions_follow_up_date').on(table.followUpDate),
    };
});


// =================================================================
// RELATIONS
// =================================================================

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  requests: many(searchRequests),
  comments: many(comments),
  memberships: many(groupMembers),
  primaryGroup: one(groups, {
    fields: [users.primaryGroupId],
    references: [groups.id]
  }),
  ownedGroups: many(groups, { relationName: 'owner' }),
  contacts: many(contacts),
  bugReports: many(bugReports),
  propertyViewingsAsVisitor: many(propertyViewings, { relationName: 'propertyViewingsAsVisitor' }),
  propertyViewingsAsOwner: many(propertyViewings, { relationName: 'propertyViewingsAsOwner' }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  propertyViews: many(propertyViews),
  propertyInquiries: many(propertyInquiries),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
    author: one(users, {
        fields: [properties.userId],
        references: [users.id],
    }),
    comments: many(comments),
    user: one(users, {
        fields: [properties.userId],
        references: [users.id]
    }),
    propertyViewings: many(propertyViewings),
    views: many(propertyViews),
    inquiries: many(propertyInquiries),
}));

export const searchRequestsRelations = relations(searchRequests, ({ one, many }) => ({
    author: one(users, {
        fields: [searchRequests.userId],
        references: [users.id],
    }),
    comments: many(comments),
    user: one(users, {
        fields: [searchRequests.userId],
        references: [users.id]
    }),
}));

export const propertyViewingsRelations = relations(propertyViewings, ({ one }) => ({
    property: one(properties, {
        fields: [propertyViewings.propertyId],
        references: [properties.id],
    }),
    visitor: one(users, {
        fields: [propertyViewings.visitorId],
        references: [users.id],
        relationName: 'propertyViewingsAsVisitor'
    }),
    owner: one(users, {
        fields: [propertyViewings.ownerId],
        references: [users.id],
        relationName: 'propertyViewingsAsOwner'
    }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    author: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    property: one(properties, {
        fields: [comments.propertyId],
        references: [properties.id],
    }),
    request: one(searchRequests, {
        fields: [comments.requestId],
        references: [searchRequests.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: 'replies'
    }),
    replies: many(comments, {
        relationName: 'replies'
    }),
    interactions: many(userCommentInteractions),
}));

export const userCommentInteractionsRelations = relations(userCommentInteractions, ({ one }) => ({
    user: one(users, {
        fields: [userCommentInteractions.userId],
        references: [users.id],
    }),
    comment: one(comments, {
        fields: [userCommentInteractions.commentId],
        references: [comments.id],
    }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const contactInteractionsRelations = relations(
  contactInteractions,
  ({ one, many }) => ({
    contact: one(contacts, {
      fields: [contactInteractions.contactId],
      references: [contacts.id],
    }),
    user: one(users, {
      fields: [contactInteractions.userId],
      references: [users.id],
    }),
  })
);

export const propertyViewsRelations = relations(propertyViews, ({ one }) => ({
    property: one(properties, {
        fields: [propertyViews.propertyId],
        references: [properties.id],
    }),
    user: one(users, {
        fields: [propertyViews.userId],
        references: [users.id],
    }),
}));

export const propertyInquiriesRelations = relations(propertyInquiries, ({ one }) => ({
    property: one(properties, {
        fields: [propertyInquiries.propertyId],
        references: [properties.id],
    }),
    propertyOwner: one(users, {
        fields: [propertyInquiries.propertyOwnerId],
        references: [users.id],
    }),
    user: one(users, {
        fields: [propertyInquiries.userId],
        references: [users.id],
    }),
}));
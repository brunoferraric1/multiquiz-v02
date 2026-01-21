# MultiQuiz - Product Requirements Document

## Overview

**MultiQuiz** is a SaaS platform for creating AI-powered interactive quizzes focused on lead generation and audience engagement. Users build quizzes through a conversational AI assistant, customize the design, and publish shareable quizzes that collect visitor data.

**Target audience**: Marketers, coaches, small business owners, and content creators who need to generate leads and engage their audience without technical skills.

---

## Core Value Proposition

1. **AI-Powered Creation** – Build quizzes by chatting with an AI that generates questions, answers, and outcome logic.
2. **Lead Capture** – Collect name, email, and phone before revealing quiz results.
3. **Customizable Design** – Match your brand with colors, images, and CTA buttons.
4. **Analytics & Insights** – Track views, starts, and completions.

---

## Key Features

### 1. Quiz Builder (AI Chat)
- Conversational interface where users describe their quiz idea
- AI generates title, description, questions, answer options, and outcomes
- Real-time extraction updates the visual builder as you chat
- Manual editing via sheets/modals for fine-tuning

### 2. Visual Quiz Structure
- **Introduction**: Title, description, cover image, and CTA button
- **Questions**: Text, optional image, 2-6 answer options (single or multiple choice)
- **Outcomes**: Personalized results based on answer scoring, with optional CTA
- Drag-and-drop reordering

### 3. Lead Generation Form
- Optional screen shown before results
- Configurable fields: Name, Email, WhatsApp
- Custom title, description, and button text
- Enable/disable toggle

### 4. Customization
- Primary color theming
- Cover and outcome images (upload or AI-generated prompts)
- Custom CTA text and URL per outcome

### 5. Publishing & Sharing
- Draft/Live separation – edits don't affect published version
- Publish, update, or unpublish controls
- Shareable public URL (`/quiz/[id]`)
- Preview mode before publishing

### 6. Dashboard
- List of user's quizzes with quick stats
- Create new, edit, or delete quizzes
- Search and filter (future)

### 7. Analytics (Basic)
- Views, starts, completions per quiz
- Stats stored and tracked automatically

---

## Data Model (Simplified)

| Entity | Key Fields |
|--------|------------|
| **Quiz** | id, title, description, coverImageUrl, primaryColor, questions[], outcomes[], leadGen, isPublished, stats, ownerId |
| **Question** | id, text, imageUrl, options[], allowMultiple |
| **AnswerOption** | id, text, icon, targetOutcomeId |
| **Outcome** | id, title, description, imageUrl, ctaText, ctaUrl |
| **LeadGen** | enabled, title, description, fields[], ctaText |

---

## User Flows

### Flow 1: Create a Quiz
1. User clicks "Create Quiz" from dashboard
2. Chat interface opens with AI greeting
3. User describes quiz idea → AI generates structure
4. User reviews/edits in visual sidebar
5. User adds lead capture settings (optional)
6. User publishes quiz
7. Shareable link generated

### Flow 2: Edit Existing Quiz
1. User selects quiz from dashboard
2. Builder loads with existing data
3. User can chat to make changes or edit directly
4. Changes stay in draft until published

### Flow 3: Take a Quiz (End User)
1. Visitor opens quiz link
2. Sees introduction → clicks CTA
3. Answers questions one by one
4. (If lead gen enabled) Fills out form
5. Sees personalized outcome with optional CTA

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui components |
| State | Zustand (local), TanStack Query (server) |
| Backend | Firebase Firestore, Firebase Auth |
| AI | OpenRouter API |
| Validation | Zod schemas |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Quiz creation time | < 5 minutes |
| Quiz completion rate | > 60% |
| Lead capture rate | > 40% (when enabled) |
| User retention | 50% return within 7 days |

---

## Out of Scope (v1)

- Team collaboration
- Advanced branching logic
- Payments/subscriptions
- White-labeling
- Detailed analytics (funnel, per-question)
- Quiz templates library

---

## Future Considerations

- **Templates**: Pre-built quiz structures for common use cases
- **Integrations**: Webhook, Zapier, CRM exports
- **Advanced scoring**: Weighted answers, custom formulas
- **Embeddable widget**: Use quizzes on external websites
- **A/B testing**: Test different quiz versions

---

## Summary

MultiQuiz enables anyone to create engaging, lead-capturing quizzes in minutes using AI. The MVP focuses on a simple but polished experience: chat-based creation, visual editing, lead capture, and basic analytics. The architecture supports rapid iteration toward more advanced features.

# Careers with Em: Automation Blueprint

The full stack, how each piece connects, and the exact triggers to configure. Written so you can hand it to a developer or build it yourself in Zapier or Make in a weekend.

---

## The stack

| Layer | Tool | Why this one | Cost to start |
|---|---|---|---|
| DM automation | ManyChat | The standard for Instagram keyword triggers, official Meta partner | Free tier, ~$15/mo at scale |
| Email | Kit (formerly ConvertKit) or Beehiiv | Tag-based automations, visual sequence builder, creator-native | Free up to ~1k-2.5k subs |
| Website + opt-in + sales pages | Carrd (fastest) or Framer (closest to the Motion aesthetic) | Ship this week, upgrade later | $19/yr Carrd, ~$10/mo Framer |
| Checkout | Stripe Payment Links or ThriveCart | Payment link = zero build; ThriveCart adds order bumps later | Stripe: % fees only |
| Community | Circle, Skool, or Slack | 30-day challenge space | Slack free to start |
| Content database | Notion | Content calendar, hook bank, repurposing tracker | Free |
| Glue | Zapier or Make | Connects everything below | Free tier covers launch volume |
| Repurposing | Descript or OpusClip + CapCut | Long video to cut-down reels with captions | ~$15-24/mo |

Total to launch: roughly $30-60/month. Do not buy more than this until the first cohort pays for it.

---

## Automation 1: DM keyword funnel (the growth engine)

The Mariah mechanic. Every reel CTA points here.

**Flow:**
1. Viewer comments PROMPTS on a reel
2. ManyChat auto-replies in comments ("Sent! Check your DMs") and sends a DM
3. DM message: one warm line + button "Get the Prompt Pack"
4. Button asks for email inside the DM (ManyChat native field) or links to the opt-in page
5. ManyChat passes the email to Kit via native integration or a Zapier step
6. Kit tags subscriber `source:dm-prompts` and starts the Welcome sequence

**Configure:**
- Keywords: PROMPTS (lead magnet), and later CAREER or OS (challenge waitlist, tag `waitlist`)
- Set the trigger on "all posts" so old reels keep converting
- Follow-up bump: if no email after 23 hours, one reminder DM, then stop (stay inside Meta's messaging window)

## Automation 2: Email sequences

**In Kit:**
- Automation A: tag `source:dm-prompts` or form "Prompt Pack" added, then Welcome emails 1-4 on the Day 0/2/4/6 schedule
- Automation B: tag `waitlist` added, then a 2-email waitlist warm-up (what's coming + open date)
- Automation C (launch): tag `launch-open` applied to the full list on cart-open day starts the 6-email launch sequence. Add a link trigger: anyone who clicks "Join" but doesn't purchase within 24h gets tagged `abandoned` for a single reminder
- Purchase suppression: Stripe/ThriveCart purchase fires a Zap that tags `customer`, which exits them from the launch sequence immediately. This is the one automation you cannot skip: never pitch someone who already bought

## Automation 3: Purchase to onboarding

1. Stripe payment succeeds
2. Zapier: Stripe "Checkout Session Completed" trigger
3. Actions: tag `customer` in Kit (starts a 3-email onboarding: receipt/welcome, community invite + Day 1 prep, calendar links), invite to Slack/Circle via invite link email, add a row to a Notion "Students" database
4. Manual-for-now: a personal welcome DM to each founding member. At 50 people this is 30 minutes and worth every one.

## Automation 4: Content repurposing workflow

Weekly loop, matched to the weekend batching schedule:

1. **Friday night:** script 12-15 hooks in Notion (AI-assisted drafting from the hook bank)
2. **Saturday:** batch film. One long take per topic
3. **Sunday:** Descript/OpusClip cuts + captions, export
4. **Monday:** schedule the week in Meta Business Suite (free) or Later
5. **Zap:** when a Notion item flips to "Posted," log the reel link and (manually, weekly) its 7-day views back into Notion. This becomes your data on which hooks earn the next batch

Repurposing multipliers per filmed piece: the full reel, a tighter 15-second hook cut, a carousel of the same teaching (AI drafts slides from the script), and the script itself as an email or LinkedIn post. One filming session, four assets.

## How it all connects (one picture)

Reel CTA → comment keyword → ManyChat DM → email captured → Kit tag → Welcome sequence → waitlist tag → launch sequence → Stripe checkout → Zapier → customer tag + community invite + Notion row → testimonials collected on Days 5/10/14 → fed back into the next launch's sales page and emails.

## Build order (do not build all of this at once)

| Week | Build | Done when |
|---|---|---|
| 1 | Kit account, Prompt Pack form, Welcome sequence loaded | You can opt in yourself and get email 1 |
| 1 | Opt-in page live | Form submits to Kit |
| 2 | ManyChat keyword PROMPTS wired to Kit | Comment on your own reel triggers the full chain |
| 3-4 | Notion content DB + repurposing loop | One full batch cycle completed |
| Launch minus 2 weeks | Sales page, Stripe link, launch sequence loaded, purchase-suppression Zap | Test purchase exits you from the sequence |
| Launch | Community space + onboarding emails | Test student can get from payment to Day 1 materials with zero manual steps |

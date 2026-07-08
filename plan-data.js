/* The Careers with Em A to Z plan, encoded as a sequenced execution engine.
   26 steps, A through Z, in the order they should happen. The dashboard always
   surfaces the first incomplete step, so finishing one auto-populates the next.
   Edit titles, details, and doneWhen lines freely: order is the product. */

window.CWEM_PLAN = {
  goal: 'Run Careers with Em full-time',
  phases: [
    { id: 'foundation', name: 'Foundation',     letters: 'ABC' },
    { id: 'engine',     name: 'Content Engine', letters: 'DEFGH' },
    { id: 'grow',       name: 'Grow',           letters: 'IJKLM' },
    { id: 'monetize',   name: 'Monetize',       letters: 'NOPQRSTUV' },
    { id: 'freedom',    name: 'Freedom',        letters: 'WXYZ' }
  ],
  steps: [
    {
      letter: 'A', phase: 'foundation',
      title: 'Lock the brand kit',
      detail: 'Colors, fonts, logo, and voice rules finalized and saved everywhere you create: Canva, the website repo, and this dashboard should all match.',
      doneWhen: 'The brand board lives in Canva and you have stopped tweaking it.'
    },
    {
      letter: 'B', phase: 'foundation',
      title: 'Set up the Instagram profile',
      detail: 'The em icon as avatar, the one-line positioning statement in the bio, and a link in bio pointing at the prompt pack page.',
      doneWhen: 'Profile is live with the positioning line and the link in bio.'
    },
    {
      letter: 'C', phase: 'foundation',
      title: 'Write month one of content',
      detail: '30 days of reel scripts across the five pillars, drafted in one batch from the content calendar. AI drafts, you edit for voice.',
      doneWhen: '30 scripts sit in one doc, each tagged by pillar.'
    },
    {
      letter: 'D', phase: 'engine',
      title: 'Batch film weekend one',
      detail: 'Film and edit the first full week of reels in a single weekend sitting. This is the Mariah operating model: weekends produce, weekdays publish.',
      doneWhen: '15 reels are edited and scheduled for the week ahead.'
    },
    {
      letter: 'E', phase: 'engine',
      title: 'Turn the engine on',
      detail: 'Post 3x per day, Monday through Friday. Consistency beats polish at this stage: the goal is reps and data, not perfection.',
      doneWhen: 'One full week posted on schedule, no gaps.'
    },
    {
      letter: 'F', phase: 'engine',
      title: 'Ship the prompt pack',
      detail: 'The AI job search prompt pack is finished and the opt-in page delivers it automatically to anyone who drops an email.',
      doneWhen: 'You can enter a test email and the pack arrives on its own.'
    },
    {
      letter: 'G', phase: 'engine',
      title: 'Wire comment-to-DM capture',
      detail: 'The ManyChat flow: someone comments JOBS, gets an instant DM with a button, taps it, drops their email, and the pack is delivered. Your primary list-growth machine.',
      doneWhen: 'You commented the keyword yourself and received the pack end to end.'
    },
    {
      letter: 'H', phase: 'engine',
      title: 'Automate the welcome sequence',
      detail: '3 to 5 emails in the low-hype register, loaded into the email platform, triggered automatically for every new subscriber from the ManyChat flow.',
      doneWhen: 'A test subscriber received every email without you touching anything.'
    },
    {
      letter: 'I', phase: 'grow',
      title: 'Read the first 30 days of data',
      detail: 'Engagement rate, saves, and follows per post, broken down by pillar. The numbers decide what happens next, not the plan.',
      doneWhen: 'You can name your top pillar and your flop, with real numbers.'
    },
    {
      letter: 'J', phase: 'grow',
      title: 'Double down on what performs',
      detail: 'Rewrite hooks, rebalance pillars, and kill what flopped. The content calendar bends to the data.',
      doneWhen: 'The next batch weekend reflects the data, not the original guess.'
    },
    {
      letter: 'K', phase: 'grow',
      title: 'Open the Free Guides library',
      detail: 'First long-form written guide live on the site: genuinely useful, ungated, ending in one soft CTA. SEO plus a lower-pressure funnel.',
      doneWhen: 'Guide one is live and linked from the homepage.'
    },
    {
      letter: 'L', phase: 'grow',
      title: 'Reach 10,000 followers',
      detail: 'The consistency milestone. No selling before this point: the library and the trust come first.',
      doneWhen: '10k shows on the profile.'
    },
    {
      letter: 'M', phase: 'grow',
      title: 'Open the challenge waitlist',
      detail: 'A simple waitlist form for the future paid challenge, promoted in content. Intent data before you build the thing.',
      doneWhen: 'Waitlist is live with 50 or more names on it.'
    },
    {
      letter: 'N', phase: 'monetize',
      title: 'Form the LLC',
      detail: 'LLC filed, EIN issued, and a separate business bank account open. All before the first paid sale.',
      doneWhen: 'EIN in hand, business account open.'
    },
    {
      letter: 'O', phase: 'monetize',
      title: 'Design the challenge curriculum',
      detail: 'Week-by-week outline for the paid AI challenge, priced between $147 and $297, built for job seekers and corporate workers installing real AI systems.',
      doneWhen: 'Curriculum doc is complete with a price on it.'
    },
    {
      letter: 'P', phase: 'monetize',
      title: 'Build the sales page',
      detail: 'Callan’s full conversion structure inside the brand system: offer, bonus stack, objection handling, social proof, FAQ, pricing, guarantee.',
      doneWhen: 'Page is live with every section in place.'
    },
    {
      letter: 'Q', phase: 'monetize',
      title: 'Write the launch sequence',
      detail: '5 to 7 emails against a real cart-close date: value, objections, urgency, proof, final call. Persuasion mechanics, not guru tone.',
      doneWhen: 'Sequence is loaded in the email platform, dated to the launch.'
    },
    {
      letter: 'R', phase: 'monetize',
      title: 'Set up Circle and Stripe',
      detail: 'Community home on Circle, payments through Stripe, connected so a purchase triggers the community invite automatically.',
      doneWhen: 'A test purchase lands in Circle without manual work.'
    },
    {
      letter: 'S', phase: 'monetize',
      title: 'Launch the founding cohort',
      detail: 'Doors open and close on a real deadline, founding pricing, stacked bonuses, 7-day guarantee. Scarcity that is true.',
      doneWhen: 'Cart closed. Founding members are inside.'
    },
    {
      letter: 'T', phase: 'monetize',
      title: 'Deliver and document',
      detail: 'Run the cohort well, then harvest it: testimonials, specific results, screenshots. Round two is built from round one’s proof.',
      doneWhen: '5 or more testimonials with specific outcomes collected.'
    },
    {
      letter: 'U', phase: 'monetize',
      title: 'Ship low-ticket products',
      detail: '2 or 3 products at $17 to $47 on Stan Store: a resume-optimizer prompt kit, an interview-prep agent, a LinkedIn rewrite kit.',
      doneWhen: 'Products are live and selling without your involvement.'
    },
    {
      letter: 'V', phase: 'monetize',
      title: 'Relaunch with proof',
      detail: 'Cohort round two, with round one’s testimonials wired into the sales page and emails.',
      doneWhen: 'Round two revenue beats round one.'
    },
    {
      letter: 'W', phase: 'freedom',
      title: 'Automate the back office',
      detail: 'AI-drafted first responses for common support questions, plus the weekly AI trend scan so research stops requiring doomscrolling.',
      doneWhen: 'A full week runs without a manually written support reply.'
    },
    {
      letter: 'X', phase: 'freedom',
      title: 'Hit the revenue floor',
      detail: 'Baseline expenses covered by the business for 3 to 6 consecutive months. A specific number, hit repeatedly, not once.',
      doneWhen: 'The trigger number, sustained. Evidence, not a feeling.'
    },
    {
      letter: 'Y', phase: 'freedom',
      title: 'Give notice',
      detail: 'The evidence-based exit from the 9 to 5. The floor is holding, the runway is saved, the decision is already made by the numbers.',
      doneWhen: 'Last day is on the calendar.'
    },
    {
      letter: 'Z', phase: 'freedom',
      title: 'Trial the dream',
      detail: '1 to 3 months in Italy, Spain, or Indonesia, business running from a laptop. The trial run before the permanent move.',
      doneWhen: 'Flights booked. The business runs from anywhere.'
    }
  ]
};

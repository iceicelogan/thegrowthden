---
title: The Angle Storm Pack
date: 2026-09-10
updated: 2026-10-06
slug: angle-storm-pack
description: Logan Ice's creative development loop for paid social as seven prompts you can paste into Claude or ChatGPT: name the default angle, force new angles away from it, score them, test them on five independent personas, and loop until one of them fights for an angle.
format: html
---

<p><img loading="lazy" src="/uploads/notes/angle-storm-pack/89475f0c8651af66e7e51e35af00ab2b.png" alt="Notes from the Den, edition 1: The Angle Storm Pack. Seven copy-paste prompts that force new ad angles apart, then make a synthetic focus group fight over them."></p><p>Notes from the Den, edition 1.</p>
<p>The creative development loop I run for paid social, as seven prompts you can paste into Claude or ChatGPT this afternoon.</p>
<p>Most ad accounts don't die from bad ads. They die from ten copies of the first ad anyone thought of.</p>
<p>I see it on almost every paid social audit I do. The team asks for ten new concepts and gets back ten variations of the first thing anyone thought of, because the obvious frame is obvious for a reason and everything clusters around it. Meta learns that pond in about a week, the CPMs start climbing, and nobody in the room can say why.</p>
<p>The technical word for this is noise. You don't find signal by staring harder at the average. You find it by looking for the thing that refuses to average out. That idea is the whole point of the loop below. It isn't a way to get more ideas - It's a way to find the one that doesn't behave like the others.</p>
<p>So this is the loop, start to finish, as prompts. There is nothing to install and no email to hand over. Run it this week and tell me what happened (please)</p>
<h2>The loop in one look</h2>
<p>Generate: name the default, then force angles away from it. Converge: score for distance, believability and doability. Validate: five separately imagined people react alone, then get cross-tabbed. Loop: go again until one of them fights for an angle. Output: turn the winner into a brief and a generation prompt.</p>
<h2>1. Pin the brief and name the default</h2>
<p>Do this before you ask for a single idea. If you don't write down the obvious idea first, the model will hand it back to you ten times with small changes and call it a brainstorm. Naming it gives you something to beat.</p>
<pre><code>I need ad angles for a product. Before you generate anything, I want you to do three things and then wait for my next message.

Product: [what it is, one paragraph, plain language]
Who it is for: [the specific person who should stop scrolling, not "everyone"]
The job of this ad: [what it should make that person do or feel]
Where it runs: [Meta / TikTok / YouTube, and the format]

1. Restate the job in one sentence, in your own words.

2. Write THE DEFAULT: the angle every competitor in this category is already running, the one a decent junior marketer would produce first. Name it in five words or fewer and describe it in two sentences.

3. List three things about this buyer's real life that the default angle ignores.

Do not generate any other angles until I ask for them.</code></pre>
<p>That last line matters more than it looks. Models want to sprint, and if you let this one run it will bury the default under twenty ideas before you've had a chance to look at it.</p>
<h2>2. The storm: force the angles apart</h2>
<p>This is the heart of it. Each operation starts the search from a different place, which is what actually produces distance. I run at least four operations and I don't let it polish anything, because a rough idea far from the default is worth more here than a pretty idea sitting next to it.</p>
<pre><code>Now run an angle storm against the default you named. Use every operation below. For each one, generate three angles and label each with its operation. Do not polish anything. Distance from the default is the only thing that matters right now.

INVERSION: take the category's core promise and argue the opposite. If everyone promises fast, sell slow. If everyone promises easy, sell hard-but-worth-it.

VILLAIN SWAP: change who the enemy is. Not the competitor, but the spreadsheet, the Sunday-night dread, the drawer full of the old thing, the well-meaning advice that kept them stuck.

NEED STATE: name three different moments or motivations that would make three different people buy this same product, and write an angle for each one. It is the same product fishing in a different pond.

UNEXPECTED BUYER: who buys this that we never advertise to? The gift-giver, the spouse, the person buying it for a reason we would never put on the site. Write for that person.

AUDIENCE HERESY: say the thing this buyer privately believes but nobody in the category will say out loud.

ZOOM: shrink to one hyper-specific moment, like the 6:04am alarm or the third time they re-tape the box, or blow out to a whole worldview.

FORMAT THEFT: borrow the structure of an unrelated genre, like an obituary, a changelog, a recipe, a court transcript, or an apology.

Give me the list grouped by operation, one line per angle, with the operation label in caps at the front of each line, and then wait for me.</code></pre>
<p>If everything it produces still feels safe, the storm failed, and you should run two more operations before you move on. What you're looking for is at least one angle that makes you a little nervous.</p>
<h2>3. Converge without killing the weird ones</h2>
<p>Volume shipped as noise is just noise. But the usual way of narrowing, "which one do I like," drags you straight back to the default. So I score on three axes and make the model show its work.</p>
<pre><code>Score every angle from the storm on three axes, 1 to 5 each.

DISTANCE: how far is it from the default we named? A 5 is a different pond entirely.
BELIEVABILITY: would this specific buyer believe it coming from this brand? A 5 rings true instantly.
DOABILITY: could a small team actually make this ad this week with a phone, a product, and an image model? A 5 is easy.

Show the scores in a table, then pick the top four by total with one rule: at least two of the four must score 4 or 5 on DISTANCE, even if a safer angle would have outscored them. For each of the four, write the angle in one sentence, the opening line or opening visual, and the first thing that would go wrong with it.</code></pre>
<h2>4. Cast the focus group</h2>
<p>One opinion on creative, even a smart one, is a coin flip, because it collapses a whole audience into one reader. So I don't ask the model what it thinks. I make it build five specific people, and then I make those people react separately.</p>
<pre><code>Cast a five-person focus group for this product. These need to feel like specific humans, not demographic labels. Give each one a short character sheet: a name, their life situation right now, how much they know about this product category, what is currently frustrating them, and how skeptical they are of ads on a 1 to 5 scale.

The panel must include one person who has the problem this product solves but has never heard of this category of solution, one person who already tried a competitor and was let down, one natural skeptic who assumes every ad is lying, one warm lead who is close to buying already, and one wildcard who is adjacent to the target, like the buyer's spouse, a lapsed customer, or a competitor's happy customer.

Write the five character sheets and wait for me. I don't want any reactions yet.</code></pre>
<p>The wildcard is where the reactions nobody planned for come from, so I always keep that seat in the panel.</p>
<h2>5. Independent exposure, one persona at a time</h2>
<p>This is the step people skip, and it's the one that makes the whole thing work. If all five personas react in the same chat, they converge. So I open a fresh chat per persona and give it only that one character sheet and the four angles. It's five short chats, and it's the difference between a focus group and one model agreeing with itself.</p>
<pre><code>You are the person described below. You are scrolling your phone mid-morning, half paying attention, and these four ads show up one after another. React in first person, present tense, as this person. Be honest, because most real people scroll past most things.

YOUR CHARACTER SHEET: [paste one persona from step 4]
THE FOUR ANGLES: [paste the four angles from step 3, each with its opening line or visual]

For each angle, tell me the first two seconds (what you noticed, and whether you kept scrolling), your gut feeling in your own words, what you actually did (scrolled past, tapped, saved, screenshotted it for someone, bought, or rolled your eyes), and the sentence you would say to a friend about it, if you said anything at all.

Then answer one more question. Is there one of these four you would argue for if someone tried to kill it? If yes, tell me which one and why it hits you specifically. If no, say so.</code></pre>
<h2>6. Cross-tab, then decide whether to loop</h2>
<p>Now you have five independent reactions, and the job is to read across them. Patterns that show up in more than one persona are real. A quirk from one persona is a quirk. And the thing I'm actually looking for is a fight.</p>
<pre><code>Here are five independent reactions to the same four angles, from five different people. [paste all five]

Read across them and tell me:

PATTERNS: what did two or more people hit independently? Those are real.
SPLITS: which angle worked on whom and lost whom, and what that says about targeting.
FATAL vs QUIRK: which objections would kill an angle for the audience, and which are one person's taste. Leave the quirks alone.
THE FIGHT: did anyone argue for an angle? If yes, name the angle and the person and quote them. That angle is a strong candidate whether or not it won on average.
VERDICT: for each angle, one of SHIP IT, FIX ONE THING (and say what), or KILL IT.

If nobody fought for anything, say plainly: NO FIGHT. GO AGAIN.</code></pre>
<p>Here is the loop rule. If the answer is NO FIGHT, you go back to step 2 and run two operations you didn't use the first time. You do not ship the angle that did fine on average, because average is the default again with small changes. You loop until one persona fights for something, or until an angle gets strong support from at least three of the five, and that's the moment Meta has a new pond to fish in.</p>
<h2>7. Turn the winner into a brief and a generation prompt</h2>
<p>An angle isn't an ad. This last prompt turns the survivor into something you can hand to a designer, a UGC creator, or an image or video model the same afternoon.</p>
<pre><code>Take this winning angle and turn it into a production brief.

ANGLE: [paste it]
WHO IT HIT: [the persona(s) who fought for it, one line each]
FORMAT: [static image / 15-second video / carousel]
PLACEMENT: [feed / stories / reels]

Write three headline options under 40 characters, each in the voice of the persona who fought for it; two primary-text options under 125 characters with no hashtags; the visual, described in plain language (what is in frame, what the person is doing, what the light is like, and what feels a little wrong or surprising about it); one paragraph I can paste into an image model, with subject, setting, camera distance, lighting, mood, and the one specific detail that makes it this angle and not a stock photo, with no text in the image; for video, the motion in the first three seconds and the moment the product appears; and one sentence naming the thing to protect so a designer doesn't sand it back into the default.</code></pre>
<h2>Why AI gives you the same angle ten times</h2>
<p>Language models are built to give the most likely answer. Ask one for ad angles for a sleep supplement and it will give you "wake up refreshed" ten different ways, because that's what most sleep ads say. It isn't the tool being lazy. It's doing exactly what it's for, and the obvious angle is the most likely one. The loop above exists to make the obvious idea explicit, then push the model away from it in directions a tired creative team wouldn't try on a Thursday afternoon.</p>
<h2>What the numbers say</h2>
<ul class="evidence">
<li>Creative is the biggest lever you control. NCSolutions' analysis of nearly 450 CPG campaigns across TV and digital found creative accounted for 49% of incremental sales contribution, ahead of brand (21%), reach (14%) and targeting (11%). (<a href="https://www.prnewswire.com/news-releases/in-advertising-the-balance-is-shifting-brand-factors-like-consumer-loyalty-now-have-a-greater-impact-on-sales-results-than-reaching-a-broader-audience-301897320.html" target="_blank" rel="noopener">NCSolutions, Five Keys to Advertising Effectiveness, August 2023</a>)</li>
<li>Kantar's December 2024 analysis ranks creative quality second only to brand size in advertising profitability, and the top element within the marketer's control. (<a href="https://www.kantar.com/inspiration/advertising-media/the-codependence-factor" target="_blank" rel="noopener">Kantar, The co-dependence factor, December 2024</a>)</li>
<li>Everyone already has the tool. Gartner found 77% of marketing organizations that have adopted generative AI use it for creative development, rising to 84% of high performers. The differentiation is the process, not the software. (<a href="https://www.gartner.com/en/newsroom/press-releases/2025-02-18-gartner-survey-reveals-over-a-quarter-of-marketing-organizations-have-limited-or-no-adoption-of-genai-for-marketing-campaigns" target="_blank" rel="noopener">Gartner, February 2025</a>)</li>
<li>The volume bar at the top of DTC is high. Motion's 2025 creative trends report, based on 500+ DTC advertisers and $100M+ in analyzed spend, found 86% plan to increase AI use for research and ideation and 79% for creative production. (<a href="https://motionapp.com/creative-trends" target="_blank" rel="noopener">Motion, 2025 Ad Creative &amp; Creative Strategy Trends</a>)</li>
</ul>
<h2>What a Meta creative strategist sees</h2>
<blockquote><p>Some of the top DTC brands we work with are creating 50-70 new ads weekly on Meta platforms alone.</p><cite>Gil Chaimovski, Creative Strategist, Meta, quoted in <a href="https://motionapp.com/creative-trends" target="_blank" rel="noopener">Motion's 2025 Creative Trends report</a></cite></blockquote>
<p>You don't need fifty a week. You need the five you make to disagree with each other.</p>
<h2>Where people get it wrong</h2>
<p>They skip naming the default and wonder why everything sounds familiar. They ask for "more creative" instead of applying an operation. They build one persona that's secretly themselves. They show the personas all the angles in one conversation, so the reactions bleed into each other. And they take the top-scoring angle straight to production without asking whether it's different enough to teach them anything if it fails.</p>
<h2>How I actually run this</h2>
<p>I don't do it by hand anymore. I turned prompts 1 through 3 into a skill I call Angle Storm and prompts 4 through 6 into one called Focus Group, and the personas run as separate agents so they can't peek at each other's answers. The loop is the same one you just read, and the skills just save me the pasting.</p>
<p>The rule I don't break is the fight. I don't ship the angle that did fine on average. I go again until one persona digs in for an angle the others were lukewarm on, because that's a need state the account hasn't been talking to yet, and a need state is a new pond. That's what the loop is for, and it's why I'd rather have one strange angle somebody loves than ten reasonable ones nobody would argue about.</p>
<p>If you run it this week, I'd love to hear what the fight looked like. I read every reply myself, and the good ones end up in the next edition. And if you'd rather I ran the whole loop with your team, that's what I do all day at The Growth Den. Enter with problems. Exit with systems.</p>
<p>Thanks for reading this far. Go make something weird!</p>
<p>Logan</p>

/**
 * What each god says when you stand at its shrine. Twenty lines per god: four for each stage of the
 * relationship (a stranger, Acknowledged, Favored, Devoted, Exalted or an Apostle), chosen by favor and
 * the hour. Voices differ on purpose.
 */
export const GOD_LINE_TIERS = ['stranger', 'acknowledged', 'favored', 'devoted', 'exalted'] as const;

export const GOD_LINES: Record<string, string[][]> = {
  solenne: [
    ['“I do not know you. That is not an accusation. Yet.”', '“Stand in the light. Let me see your face.”', '“Many pass this stone. Few say what they came for.”', '“Justice does not hurry. Neither do I.”'],
    ['“You have been seen. Keep your hands where I can see them.”', '“A good beginning is only a beginning.”', '“I noticed what you did at the river. It was correct.”', '“Come closer. The dawn does not bite.”'],
    ['“You walk well in the light. Do not trip on pride.”', '“I have watched you choose the harder right. Often.”', '“I would not be ashamed to be your witness.”', '“You are becoming dependable. It is a rare compliment.”'],
    ['“Mine, in the way that matters: you hold yourself to my standard before I do.”', '“There is a seat for you in the morning. Take it when you are ready.”', '“Your enemies are mine. Your doubts are mine as well.”', '“I trust you with a sword. I trust you with the truth. It is not the same.”'],
    ['“Child of the open eye. I have not been this pleased in an age.”', '“Go and be seen. It is all I ask.”', '“When you stand in my light, I stand with you.”', '“Justice is a long road, and you are my favorite stretch of it.”'],
  ],
  morrath: [
    ['“You will find me, in time. Everyone does.”', '“I am in no rush. I have never been.”', '“Do not pray for long. I hear everything the first time.”', '“Ask your question. The answer is usually a door.”'],
    ['“You do not fear me. That is either wisdom or a lack of imagination.”', '“Quiet. Good. You know when to speak and when to wait.”', '“You have seen an ending up close. Remember its face.”', '“I keep a small place for those who respect what is finished.”'],
    ['“You carry endings well. Lightly. It suits you.”', '“Some call me cruel. They have never been owed.”', '“Your enemies have come to me, one by one. They send their regards.”', '“I find you restful company, which is rare.”'],
    ['“You and I understand each other. It is the highest courtesy I offer.”', '“When your time comes, I will hold the door myself.”', '“Not yet, I think. There is more work in you.”', '“Few people leave me waiting. You are one of them.”'],
    ['“Keeper’s child. The last door will open gently for you.”', '“Go. Be thorough. Be kind where it costs nothing.”', '“Everything ends, and you are a very good ending.”', '“I will remember you when the world has forgotten itself.”'],
  ],
  kael: [
    ['“A stranger! Good. Strangers fight harder when they have something to prove.”', '“Who are you, and what are you worth in a fight?”', '“Speak up! The wind carries cowards’ whispers away.”', '“Banner’s up. Are you in or out?”'],
    ['“You have the look of someone who finishes things. Good.”', '“I heard about that brawl. More of that.”', '“Not bad. Not yet great. Keep going.”', '“Stand tall. The banner is watching.”'],
    ['“Now THAT is a warrior!”', '“Your name is starting to carry. Make it carry further.”', '“Three songs already, and you have not died. Remarkable.”', '“Keep winning. I enjoy it more than I admit.”'],
    ['“My champion in all but the oath. You know it, I know it.”', '“Fight beside me when the real war comes. You have earned a place.”', '“I would put you in the front rank and sleep like a baby.”', '“You laugh at the right moments. I like that.”'],
    ['“Red Banner’s child! There will be songs!”', '“Take what you want. Win what you cannot.”', '“If I had a hundred of you I would conquer the moon.”', '“Glory is a road, and you are paving it with other people’s doubts.”'],
  ],
  ysolde: [
    ['“Quiet steps, stranger. The grass is listening.”', '“You are loud. It is fine. The forest forgives, once.”', '“Take only what you need, and ask for the rest.”', '“Have you eaten? The hunt is a long business.”'],
    ['“You have been kind to a deer. I have noticed. So has the deer.”', '“The wood does not know you yet, but it is curious.”', '“Good. You left the campfire out.”', '“Come, sit. The moss is dry on this side.”'],
    ['“The wood knows your step now. It is not afraid.”', '“You hunt cleanly. It is the best prayer there is.”', '“Wolves do not mistake you for prey. High praise.”', '“I saved you a place at the fire.”'],
    ['“My own, almost. The antlers on your shadow are showing.”', '“You take life as if it mattered, because it does.”', '“I would follow your tracks anywhere.”', '“The hunt is a conversation. You have become fluent.”'],
    ['“Child of the green hour! The moon is generous tonight.”', '“Go. Be wild. Be careful. Both are true.”', '“The wood is yours as much as it is mine.”', '“The hunt ends, and begins again. You are its best verse.”'],
  ],
  vex: [
    ['“Oh, hello! You look like someone with something in their pockets.”', '“Pray all you like. The odds are the odds.”', '“Never met you! That means you owe me a favor in advance.”', '“Careful. The coin is already in the air.”'],
    ['“Ah, you got the joke. Most don’t. Sit down.”', '“Lucky streak? Don’t look at me. I only watched.”', '“You are an acceptable gambler. Barely.”', '“There is a wink in your eye. I like it.”'],
    ['“Did you cheat? Please say you cheated.”', '“I like your odds. I like your nerve more.”', '“Three sixes and a smile. That’s the dream.”', '“We should rob someone, you and I. Metaphorically.”'],
    ['“Between us, I rigged one die for you. Don’t tell anyone.”', '“My favorite mortal, in a field with two hundred.”', '“Whatever you’re planning, do it now.”', '“Delightful. Terrifying. Keep going.”'],
    ['“My little marvel! Pick a card, any card. It’s always the good one.”', '“Luck is a story. You are my best character.”', '“Everyone will say it was skill. We’ll know better.”', '“Go on. Break something expensive. For me.”'],
  ],
  thalor: [
    ['“Hm. Hands. Let me see your hands.”', '“A stranger. Did you bring metal, or just opinions?”', '“Speak plain. The forge is loud.”', '“The anvil does not care who you are. Neither do I. Yet.”'],
    ['“Your work is passable. Practice.”', '“Rough edges. Good bones.”', '“Hm. You’ve repaired something with care. I noticed.”', '“Don’t stand there. Find a hammer.”'],
    ['“Now that is a clean weld. Well done.”', '“You respect your tools. I respect that.”', '“Steady hands. Steady nerves. Keep them.”', '“Sit. I’ll tell you how I forged the first sword.”'],
    ['“I’d trust you with my best hammer. I don’t say that often. Ever.”', '“The forge likes you. It gets quiet when you’re near.”', '“Not many see the work in the work. You do.”', '“You’re one of mine. Don’t let it go to your head.”'],
    ['“Anvil-child. You are made of the good metal.”', '“Strike true, and the world shapes itself.”', '“Go and make something that outlasts you.”', '“When the last fire dies, I’ll know you kept one burning.”'],
  ],
  nymira: [
    ['“Salt on your lips, stranger. The tide has noticed.”', '“The sea gives. The sea takes. You haven’t asked it anything yet.”', '“Listen. The shells are talking about you.”', '“Mind your boots. The shore is not as patient as it looks.”'],
    ['“The waves are friendlier than usual today. I wonder why.”', '“You smell like rain. A promising sign.”', '“A bottle came ashore with your name on it. I read it. Sorry.”', '“Sit by the water. The spray is free.”'],
    ['“The tide leans toward you now. Don’t drown in it.”', '“You sing off-key in the storm. I love it.”', '“Lightning likes you. I told it to behave.”', '“The sea carries your name. Gently.”'],
    ['“Mine, nearly. The storm already thinks you are.”', '“Walk the shore with me. I’ll show you a few drowned things.”', '“You have the sea’s patience, and its temper.”', '“If the tide forgets you, I will remind it.”'],
    ['“Child of the storm. The deep is yours as much as mine.”', '“Go. The wind is up. You were made for it.”', '“Every wave is a small bow to you. Accept it.”', '“Storm and calm, and you in the middle.”'],
  ],
  aurelis: [
    ['“A visitor. Interesting. Do you read?”', '“State your question. The more precise, the better the answer.”', '“I have never met you. This is an oversight, which I will correct.”', '“Mind the shelves. They are older than the walls.”'],
    ['“You asked a good question earlier. I am still thinking about it.”', '“Your handwriting is atrocious. Your ideas are not.”', '“Curious. Keep being curious.”', '“Sit. We were just starting the part where it gets difficult.”'],
    ['“You are learning. It shows in the way you stop talking.”', '“There is a footnote in your biography. I am fond of it.”', '“A mind well-used leaves marks. Yours are neat.”', '“I took notes on your last fight. I am very pleased.”'],
    ['“You have moved from student to colleague. Do not tell the others.”', '“Ask me anything. I mean it. I may even answer.”', '“I have kept a place on the shelf for your name.”', '“You noticed the thing nobody notices. Good.”'],
    ['“Child of the unwritten page. I would cite you, if I could.”', '“Knowledge is a flame, and you carry it well.”', '“Go. Discover something. Come back and explain it badly.”', '“You are the footnote that changed the text.”'],
  ],
  hesha: [
    ['“Oh, you look tired. Sit, sit. Have you eaten?”', '“Come in from the cold. Everyone is welcome at a fire.”', '“I don’t know you yet, but I would like to.”', '“Warm hands first. Questions later.”'],
    ['“There you are! I saved some bread.”', '“You’ve been looking after people. I noticed.”', '“A kind word to a stranger goes a long way.”', '“Sit by the fire a while.”'],
    ['“You look well. Better than last time.”', '“I hear you stayed up with the sick. That matters.”', '“Come, take a bowl. You have earned it.”', '“The hearth is warm tonight. I made it so.”'],
    ['“My dear one. You carry so much. Put some of it down.”', '“The door is always open for you. Always.”', '“You’ve grown so kind. It suits you.”', '“Whatever you did, you are forgiven. Eat.”'],
    ['“Child of the hearth. Go home, whenever you wish, wherever it is.”', '“Warmth is the strongest thing there is. You are very warm.”', '“There is a light in your window. I lit it.”', '“Rest. The world can wait one night.”'],
  ],
  grimvald: [
    ['“A new face. What are you buying, and what are you selling?”', '“Everything has a price. Even this conversation.”', '“State your business. Briefly.”', '“Pray if you must. I prefer receipts.”'],
    ['“You pay your debts. I like that in a customer.”', '“Your credit is acceptable. For now.”', '“Mm. Modest portfolio. Promising.”', '“Wealth is a habit. You are developing it.”'],
    ['“Your ledger is respectable. I might be impressed.”', '“I like the way you negotiate. Rude but fair.”', '“You are a good investment. Don’t make me regret it.”', '“Gold in motion makes more gold. You understand.”'],
    ['“Preferred client. A small, exclusive club.”', '“Your word is as good as a contract. Almost.”', '“I have never lost money on you.”', '“There is a vault with your name on it. Metaphorically.”'],
    ['“Chosen of the golden scale. Every transaction a small miracle.”', '“Be generous. It is the best return.”', '“I would give you a discount if I had them.”', '“The books balance, and you are the reason.”'],
  ],
  lyssara: [
    ['“Shh. Somebody is dreaming here. Come closer, quietly.”', '“You look like you haven’t slept. Lie down a moment.”', '“I will remember you in the morning. If I wake.”', '“The moon is out. Speak softly.”'],
    ['“You rested well last night. I can tell.”', '“A kind word to the sleeping is worth a hundred to the waking.”', '“Come, sit by the well. The water has your face in it.”', '“Mm. I dreamed of you. It was a good dream.”'],
    ['“You are easy company in the dark.”', '“The moon leans toward you now. Don’t wake it.”', '“I heard you were merciful. I heard it in a dream.”', '“Sleep is a gift. You use it well.”'],
    ['“I will tuck you in, if you like. Metaphorically.”', '“My own, almost. You dream like one of us.”', '“Whatever haunts you, I will sit with it.”', '“There is a pillow with your name on it.”'],
    ['“Moon-child. Even the nightmares bow to you.”', '“Go gently. Wake gently. Be gentle.”', '“I am always a little bit there with you, in the dark.”', '“Sleep well. I will keep watch.”'],
  ],
  ordrun: [
    ['“Stand. Or sit. The stone is patient either way.”', '“I do not know you. I will.”', '“State your need. Briefly. I am not quick.”', '“Walk slowly. Ground remembers.”'],
    ['“You finished what you started. Good.”', '“Hm. Steady.”', '“The work held. I noticed.”', '“Sit, if you wish.”'],
    ['“You do not yield. That is the whole of the art.”', '“Nothing moved you today. Well done.”', '“You carry weight well.”', '“Your foundations are good.”'],
    ['“I would build on you.”', '“Few people hold. You hold.”', '“You are a wall that learned to walk.”', '“Stay as long as you like. The stone will not mind.”'],
    ['“Child of the mountain. Nothing will move you that you do not allow.”', '“Endure. It is enough.”', '“When the last wall falls, you will still be standing.”', '“Go. I will be here.”'],
  ],
  seraphel: [
    ['“Oh! A traveler! Which way are you headed?”', '“No one stays long. That is the point.”', '“Don’t tell me your name. Tell me where you’re going.”', '“Mind the wind. It likes to be asked.”'],
    ['“You look like someone who wants the open road.”', '“You left the cage open for something. Good.”', '“The wind is on your side today.”', '“Come, race me to the next hill.”'],
    ['“Faster! You’re almost there!”', '“You carry nothing you don’t need. Lovely.”', '“I like how you leave a place. Cleanly.”', '“The road likes you.”'],
    ['“My dear, you could be a gale if you tried.”', '“Free as the wind, and not at all lost.”', '“Whatever holds you, I will pick the lock.”', '“I will carry you, if you ask.”'],
    ['“Child of the open road! Go anywhere you like!”', '“The sky has your name in it. Look up.”', '“The wind is yours. Do something wonderful.”', '“Every door you open, I open with you.”'],
  ],
  mirrin: [
    ['“You are exactly on time. Welcome.”', '“I have been expecting you, or someone like you.”', '“State the date, and your business.”', '“A memory is waiting for you. It is patient.”'],
    ['“We have met before, in a manner of speaking.”', '“Ah. The next page. How lovely.”', '“I recall what you did last week. Politely.”', '“Sit. We have a while.”'],
    ['“You remember well. A rare gift.”', '“Your past and your future are on good terms.”', '“I have bookmarked your story.”', '“Time moves kindly around you.”'],
    ['“You and I have an understanding, across several hours.”', '“I will keep your memory safe when you cannot.”', '“There is a space in the ledger with your name.”', '“I have already thanked you, I think. In advance.”'],
    ['“Child of the long memory. Nothing you did will be forgotten.”', '“Go. The hour is yours.”', '“I remember what you will do, and I am proud.”', '“It has not happened yet, and it is going to be wonderful.”'],
  ],
};

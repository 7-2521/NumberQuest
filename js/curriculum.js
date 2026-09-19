/* The learning path: worlds -> lessons. Each lesson has
     learn:    slides shown first (text/visual slides, or `demo` worked examples that step through the written method)
     gen:      generator spec for practice + quiz problems
     practice: number of guided problems (hints, unlimited tries)
     quiz:     number of quiz problems (stars depend on accuracy)
   Methods are the traditional ones: memorized facts, place-value columns, carrying, borrowing,
   long multiplication with partial products, and long division (divide, multiply, subtract, bring down). */
const Curriculum = (() => {
  const O = Vis.objs, G = Vis.groups;
  const eq = s => `<div class="eq-line">${s}</div>`;
  const col = html => `<pre class="col-example">${html}</pre>`;

  const WORLDS = [
    /* ------------------------------------------------------------------ */
    {
      id: 'numbers', name: 'Number Land', icon: '🏝️', color: '#00b4d8',
      blurb: 'Counting, comparing, and place value',
      lessons: [
        {
          id: 'count10', title: 'Counting to 10', icon: '🔢', practice: 6, quiz: 8,
          gen: { type: 'count', min: 1, max: 10 },
          learn: [
            { title: 'Let\'s count!', html: `<p>Point to each one and say a number. The last number you say is <b>how many</b> there are.</p>${O('🍎', 5)}<p class="say">1, 2, 3, 4, 5 &rarr; there are <b>5</b> apples!</p>` },
            { title: 'Count carefully', html: `<p>Count each fish only once. Go left to right.</p>${O('🐟', 8)}<p class="say">1, 2, 3, 4, 5, 6, 7, 8 &rarr; <b>8</b> fish.</p>` },
            { title: 'Your turn', html: `<p>Count the objects, then tap the number on the keypad and press <b>✓</b>.</p>${O('⭐', 3)}<p class="say">How many stars? <b>3</b>!</p>` },
          ],
        },
        {
          id: 'count20', title: 'Counting to 20', icon: '🔢', practice: 6, quiz: 8,
          gen: { type: 'mixed', gens: [{ type: 'count', min: 8, max: 20 }, { type: 'next', max: 20 }] },
          learn: [
            { title: 'Bigger numbers', html: `<p>After 10 come the <b>teens</b>: 11, 12, 13, 14, 15, 16, 17, 18, 19, and then <b>20</b>.</p>${O('🐞', 13, 'wrap')}<p class="say">There are <b>13</b> ladybugs.</p>` },
            { title: 'Before and after', html: `<p>Numbers go in order. Each number is 1 more than the one before it.</p><div class="numline">${[5, 6, 7, 8, 9, 10, 11].map(n => `<span class="${n === 8 ? 'hl' : ''}">${n}</span>`).join('')}</div><p class="say">After 7 comes <b>8</b>. Before 9 is <b>8</b>.</p>` },
          ],
        },
        {
          id: 'compare', title: 'Comparing Numbers', icon: '🐊', practice: 6, quiz: 8,
          gen: { type: 'compare', max: 20 },
          learn: [
            { title: 'Greater and less', html: `<p>When we compare two numbers, we use signs.</p><div class="signs"><div><span class="sign">&lt;</span>less than</div><div><span class="sign">=</span>equal to</div><div><span class="sign">&gt;</span>greater than</div></div>` },
            { title: 'The hungry alligator', html: `<p>Think of the sign as an alligator mouth 🐊. It always opens toward the <b>bigger</b> number because it wants to eat more!</p>${eq('3 <span class="sign">&lt;</span> 7')}<p class="say">3 is less than 7. The mouth opens toward 7.</p>${eq('9 <span class="sign">&gt;</span> 4')}<p class="say">9 is greater than 4.</p>` },
            { title: 'Same amount', html: `<p>If both numbers are the same, use the equal sign.</p>${eq('6 <span class="sign">=</span> 6')}` },
          ],
        },
        {
          id: 'skip', title: 'Skip Counting', icon: '🐰', practice: 6, quiz: 8,
          gen: { type: 'skip', steps: [2, 5, 10], max: 60 },
          learn: [
            { title: 'Counting by 2s', html: `<p>Skip counting means jumping over numbers.</p><div class="numline">${[2, 4, 6, 8, 10, 12].map(n => `<span>${n}</span>`).join('')}</div><p class="say">2, 4, 6, 8, 10, 12 ...</p>` },
            { title: 'Counting by 5s and 10s', html: `<div class="numline">${[5, 10, 15, 20, 25, 30].map(n => `<span>${n}</span>`).join('')}</div><div class="numline">${[10, 20, 30, 40, 50, 60].map(n => `<span>${n}</span>`).join('')}</div><p class="say">Counting by 5s and 10s helps with money, clocks, and times tables later!</p>` },
          ],
        },
        {
          id: 'places', title: 'What Is a Place?', icon: '🏠', practice: 6, quiz: 8,
          gen: { type: 'bundles', min: 11, max: 99, ask: ['number', 'tens', 'ones'] },
          learn: [
            { title: 'We only have ten digits', html: `<p>Every number in the world is written with just these ten digits:</p><div class="digits-row">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<span>${d}</span>`).join('')}</div><p>Count with me: 7, 8, 9 ... and then we <b>run out of digits</b>! So what comes next?</p>` },
            { title: 'Bundle ten into one', html: `<p>When we have ten ones, we tie them into one <b>bundle of ten</b> and start counting ones again from zero.</p><div class="bundle-demo">${Vis.blocks(0, 0, 10)}<span class="arrow">&rarr;</span>${Vis.blocks(0, 1, 0)}</div><p class="say">10 little cubes = 1 long rod. We write it <b>10</b>: that means <b>1 ten and 0 ones</b>.</p>` },
            { title: 'The place tells you what it counts', html: `<p>A number is like a row of boxes. Each box is a <b>place</b>. The box on the far <b>right</b> counts <b>ones</b>. The next box to the <b>left</b> counts <b>tens</b>.</p>${Vis.chart(23)}${Vis.number(23, true)}<p class="say">23 means 2 rods and 3 cubes: <b>2 tens and 3 ones</b>. 20 + 3 = 23.</p>` },
            { title: 'Same digit, different place', html: `<p>The digit 3 can mean different amounts. It depends on <b>where</b> it sits!</p><div class="same-digit"><div>${Vis.number(3, true)}<b>3</b><span>3 ones</span></div><div>${Vis.number(30, true)}<b>30</b><span>3 tens</span></div></div><p class="say">Every step to the <b>left</b> makes a digit worth <b>ten times more</b>.</p>` },
            { title: 'Ten tens make a hundred', html: `<p>Keep counting up: 97, 98, 99 ... now the ones <i>and</i> the tens are full! Ten rods bundle into one big <b>hundred</b> square, and we need a third place.</p><div class="bundle-demo">${Vis.blocks(0, 10, 0)}<span class="arrow">&rarr;</span>${Vis.blocks(1, 0, 0)}</div>${Vis.chart(100)}<p class="say"><b>100</b> = 1 hundred, 0 tens, 0 ones.</p>` },
            { title: 'Reading a big number', html: `${Vis.number(342, true)}${Vis.chart(342)}<p class="say"><b>342</b> = 3 hundreds + 4 tens + 2 ones = 300 + 40 + 2.</p><p>Knowing places is the secret to adding and subtracting big numbers: we always line up ones under ones and tens under tens.</p>` },
            { title: 'Your turn', html: `<p>You'll see blocks. Count the <b>rods</b> (tens) and the <b>cubes</b> (ones), then answer the question.</p>${Vis.number(46)}<p class="say">4 rods and 6 cubes &rarr; 4 tens and 6 ones &rarr; <b>46</b></p>` },
          ],
        },
        {
          id: 'place2', title: 'Tens and Ones', icon: '🧱', practice: 6, quiz: 8,
          gen: { type: 'placeValue', max: 99 },
          learn: [
            { title: 'Two-digit numbers', html: `<p>A number like <b>34</b> has two digits. The <b>3</b> is in the <b>tens</b> place and the <b>4</b> is in the <b>ones</b> place.</p>${Vis.tens(3, 4)}<p class="say">3 tens and 4 ones = 30 + 4 = <b>34</b></p>` },
            { title: 'Place value chart', html: `<table class="pv"><tr><th>Tens</th><th>Ones</th></tr><tr><td>3</td><td>4</td></tr></table><p class="say">The place a digit sits in tells you how much it is worth. Knowing places is the secret to adding and subtracting big numbers!</p>` },
          ],
        },
        {
          id: 'place3', title: 'Hundreds, Tens, Ones', icon: '🏢', practice: 6, quiz: 8,
          gen: { type: 'mixed', gens: [{ type: 'placeValue', min: 100, max: 999 }, { type: 'bundles', min: 100, max: 999, ask: ['number', 'hundreds', 'tens'] }] },
          learn: [
            { title: 'Three-digit numbers', html: `<p><b>582</b> has three digits. Remember: ten tens make one hundred, so the third place from the right counts <b>hundreds</b>.</p>${Vis.number(582, true)}${Vis.chart(582)}<p class="say">5 hundreds + 8 tens + 2 ones = 500 + 80 + 2 = <b>582</b></p>` },
            { title: 'Reading places', html: `<p>Always count places starting from the <b>right</b>: ones, then tens, then hundreds.</p>${eq('<span class="pvd">7</span><span class="pvd">0</span><span class="pvd">6</span>')}<p class="say">706 has 7 hundreds, 0 tens, and 6 ones.</p>` },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'addition', name: 'Addition Alley', icon: '🌈', color: '#8ac926',
      blurb: 'Addition facts to 20',
      lessons: [
        {
          id: 'add5', title: 'Adding to 5', icon: '➕', practice: 6, quiz: 8,
          gen: { type: 'addFacts', max: 5, visual: true },
          learn: [
            { title: 'Putting together', html: `<p>Adding means putting groups together to find how many in all.</p>${G('🍎', [2, 3])}<p class="say">2 apples and 3 apples make <b>5</b> apples.</p>${eq('2 + 3 = 5')}` },
            { title: 'The plus sign', html: `<p>The <b>+</b> sign means <b>add</b>. The <b>=</b> sign means <b>is the same as</b>.</p>${eq('1 + 4 = 5')}<p class="say">Count all of them: 1, 2, 3, 4, 5.</p>` },
          ],
        },
        {
          id: 'add10', title: 'Adding to 10', icon: '➕', practice: 8, quiz: 10,
          gen: { type: 'addFacts', max: 10, visual: true },
          learn: [
            { title: 'Count on', html: `<p>Start with the bigger number and count on the smaller one.</p>${eq('6 + 3 = ?')}<p class="say">Start at 6 ... 7, 8, 9. So 6 + 3 = <b>9</b>.</p>` },
            { title: 'Order doesn\'t matter', html: `<p>4 + 2 and 2 + 4 are the same. You can add in any order and get the same answer.</p>${G('🎈', [4, 2])}${eq('4 + 2 = 6 &nbsp;&nbsp; 2 + 4 = 6')}` },
            { title: 'Learn them by heart', html: `<p>The more you practice, the faster you remember. Soon you won't need to count at all!</p><div class="factgrid">${[[3, 4], [5, 5], [2, 7], [6, 4]].map(([a, b]) => `<span>${a} + ${b} = ${a + b}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'doubles', title: 'Doubles', icon: '👯', practice: 6, quiz: 8,
          gen: { type: 'addFacts', max: 20, doubles: true, visual: true },
          learn: [
            { title: 'Doubles', html: `<p>A double is a number added to itself.</p>${G('🐢', [4, 4])}${eq('4 + 4 = 8')}` },
            { title: 'Doubles to know', html: `<div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>${n} + ${n} = ${2 * n}</span>`).join('')}</div><p class="say">Memorize these — they make many other facts easy.</p>` },
          ],
        },
        {
          id: 'maketen', title: 'Making 10', icon: '🔟', practice: 6, quiz: 8,
          gen: { type: 'makeTen', visual: true },
          learn: [
            { title: 'Pairs that make 10', html: `<p>Some pairs of numbers add up to 10. Learn them all!</p><div class="factgrid">${[[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]].map(([a, b]) => `<span>${a} + ${b} = 10</span>`).join('')}</div>` },
            { title: 'Missing number', html: `<p>Sometimes the missing number is in the middle.</p>${eq('7 + ? = 10')}<p class="say">7 and how many more make 10? Count up: 8, 9, 10 — that's <b>3</b>.</p>` },
          ],
        },
        {
          id: 'add20', title: 'Adding to 20', icon: '➕', practice: 8, quiz: 10,
          gen: { type: 'addFacts', min: 8, max: 20 },
          learn: [
            { title: 'Bigger sums', html: `<p>Now the answers go up to 20. Use what you know!</p>${eq('8 + 5 = ?')}<p class="say">Count on from 8: 9, 10, 11, 12, 13. So 8 + 5 = <b>13</b>.</p>` },
            { title: 'Use doubles', html: `<p>If you know 6 + 6 = 12, then 6 + 7 is just one more: <b>13</b>.</p>${eq('6 + 7 = 13')}<p class="say">Practice until you just <i>know</i> them.</p>` },
          ],
        },
        {
          id: 'missing', title: 'Missing Numbers', icon: '❓', practice: 6, quiz: 8,
          gen: { type: 'missingAddend', max: 20 },
          learn: [
            { title: 'What\'s missing?', html: `${eq('5 + ? = 12')}<p>Ask: 5 plus what makes 12? Count up from 5 to 12: 6, 7, 8, 9, 10, 11, 12 — that's 7 jumps.</p>${eq('5 + 7 = 12')}` },
          ],
        },
        {
          id: 'addwords', title: 'Addition Stories', icon: '📖', practice: 5, quiz: 6,
          gen: { type: 'word', ops: ['add'], max: 20, visual: true },
          learn: [
            { title: 'Story problems', html: `<p>Read the story and look for the clue words: <b>more</b>, <b>in all</b>, <b>altogether</b>, <b>total</b>. They tell you to add.</p><p class="story">Mia has 6 cookies. Sam gives her 4 more. How many cookies does Mia have now?</p>${eq('6 + 4 = 10')}` },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'subtraction', name: 'Subtraction Station', icon: '🚂', color: '#ff924c',
      blurb: 'Subtraction facts to 20',
      lessons: [
        {
          id: 'sub5', title: 'Taking Away', icon: '➖', practice: 6, quiz: 8,
          gen: { type: 'subFacts', max: 5, visual: true },
          learn: [
            { title: 'Taking away', html: `<p>Subtracting means taking some away and seeing how many are left.</p>${Vis.removed('🍪', 5, 2)}<p class="say">5 cookies, 2 get eaten. <b>3</b> are left.</p>${eq('5 − 2 = 3')}` },
            { title: 'The minus sign', html: `<p>The <b>−</b> sign means <b>take away</b>. Always start with the bigger number.</p>${eq('4 − 1 = 3')}` },
          ],
        },
        {
          id: 'sub10', title: 'Subtracting to 10', icon: '➖', practice: 8, quiz: 10,
          gen: { type: 'subFacts', max: 10, visual: true },
          learn: [
            { title: 'Count back', html: `<p>Start at the first number and count back.</p>${eq('9 − 3 = ?')}<p class="say">Start at 9 ... 8, 7, 6. So 9 − 3 = <b>6</b>.</p>` },
            { title: 'Think addition', html: `<p>Subtraction is the opposite of addition. If 4 + 5 = 9, then 9 − 5 = 4 and 9 − 4 = 5.</p>${eq('9 − 5 = 4')}` },
          ],
        },
        {
          id: 'subten', title: 'Subtracting from 10', icon: '🔟', practice: 6, quiz: 8,
          gen: { type: 'subFacts', fromTen: true, visual: true },
          learn: [
            { title: 'From 10', html: `<p>Remember the pairs that make 10? They help here too.</p><div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<span>10 − ${n} = ${10 - n}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'sub20', title: 'Subtracting to 20', icon: '➖', practice: 8, quiz: 10,
          gen: { type: 'subFacts', min: 10, max: 20 },
          learn: [
            { title: 'Teen numbers', html: `${eq('14 − 6 = ?')}<p>Count back from 14: 13, 12, 11, 10, 9, 8. So 14 − 6 = <b>8</b>.</p><p class="say">Or think: 6 + ? = 14. 6 + 8 = 14, so the answer is 8.</p>` },
            { title: 'Facts to know', html: `<div class="factgrid">${[[13, 7], [15, 8], [12, 5], [17, 9], [16, 8], [11, 4]].map(([a, b]) => `<span>${a} − ${b} = ${a - b}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'families', title: 'Fact Families', icon: '👨‍👩‍👧', practice: 6, quiz: 8,
          gen: { type: 'factFamily', max: 20 },
          learn: [
            { title: 'A family of facts', html: `<p>Three numbers make a <b>fact family</b>. From 3, 5, and 8 you get four facts:</p><div class="factgrid">${['3 + 5 = 8', '5 + 3 = 8', '8 − 3 = 5', '8 − 5 = 3'].map(s => `<span>${s}</span>`).join('')}</div><p class="say">Know one, and you know them all!</p>` },
          ],
        },
        {
          id: 'subwords', title: 'Subtraction Stories', icon: '📖', practice: 5, quiz: 6,
          gen: { type: 'word', ops: ['add', 'sub'], max: 20, visual: true },
          learn: [
            { title: 'Story problems', html: `<p>Clue words for subtraction: <b>left</b>, <b>gave away</b>, <b>fewer</b>, <b>how many more</b>.</p><p class="story">Leo had 9 balloons. 4 flew away. How many balloons are left?</p>${eq('9 − 4 = 5')}<p class="say">Read carefully — some stories are addition!</p>` },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'carry', name: 'Carry Canyon', icon: '🏜️', color: '#ffca3a',
      blurb: 'Column addition and carrying',
      lessons: [
        {
          id: 'col-add-nc', title: 'Adding in Columns', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'add', digits: [2, 2], regroup: 'none' },
          learn: [
            { title: 'Remember the places', html: `<p>The right-hand digit counts <b>ones</b>, the next one counts <b>tens</b>. 43 is 4 tens and 3 ones.</p>${Vis.number(43, true)}` },
            { title: 'Line up the places', html: `<p>To add big numbers, write one number above the other. Line up the <b>ones</b> under the ones and the <b>tens</b> under the tens.</p>${col('  4 3\n+ 2 5\n─────')}<p class="say">Always start with the <b>ones</b> column on the right, then move left.</p>` },
            { title: 'Watch: 43 + 25', demo: ['add', 43, 25] },
            { title: 'Watch: 61 + 27', demo: ['add', 61, 27] },
          ],
        },
        {
          id: 'col-add-3nc', title: 'Adding 3-Digit Numbers', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'add', digits: [3, 3], regroup: 'none' },
          learn: [
            { title: 'Three columns', html: `<p>With hundreds, it's the same idea: ones first, then tens, then hundreds.</p>${col('  3 4 2\n+ 4 1 5\n───────')}` },
            { title: 'Watch: 342 + 415', demo: ['add', 342, 415] },
          ],
        },
        {
          id: 'col-add-c', title: 'Carrying', icon: '🎒', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'add', digits: [2, 2], regroup: 'some' },
          learn: [
            { title: 'When a column is too big', html: `<p>Sometimes the ones add up to 10 or more. A column can only hold <b>one digit</b>, so we <b>carry</b> the extra ten to the next column.</p>${col('  ¹\n  2 7\n+ 1 5\n─────\n  4 2')}<p class="say">7 + 5 = 12. Write the <b>2</b>, carry the <b>1</b>. Then 1 + 2 + 1 = 4.</p>` },
            { title: 'Watch: 27 + 15', demo: ['add', 27, 15] },
            { title: 'Watch: 68 + 24', demo: ['add', 68, 24] },
            { title: 'Remember', html: `<p>The little carried number always goes on top of the <b>next</b> column, and you add it in first.</p><p class="say">Say it: "Write the ones, carry the ten!"</p>` },
          ],
        },
        {
          id: 'col-add-3c', title: 'Carrying Twice', icon: '🎒', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'add', digits: [3, 3], regroup: 'some' },
          learn: [
            { title: 'Carry more than once', html: `<p>With bigger numbers you may need to carry in the ones <i>and</i> the tens. Same rule every time.</p>` },
            { title: 'Watch: 478 + 256', demo: ['add', 478, 256] },
            { title: 'Watch: 695 + 837', demo: ['add', 695, 837] },
          ],
        },
        {
          id: 'col-add-big', title: 'Big Number Addition', icon: '🏔️', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'add', digits: [4, 4], regroup: 'mixed' },
          learn: [
            { title: 'Thousands', html: `<p>Four digits, same method. Ones, tens, hundreds, thousands — carry whenever a column reaches 10.</p>` },
            { title: 'Watch: 3,758 + 4,689', demo: ['add', 3758, 4689] },
          ],
        },
        {
          id: 'add-words-big', title: 'Adding Stories', icon: '📖', practice: 4, quiz: 5,
          gen: { type: 'word', ops: ['add'], max: 99 },
          learn: [
            { title: 'Bigger story problems', html: `<p>Same clue words as before: <b>more</b>, <b>in all</b>, <b>altogether</b>. Write the numbers in columns in your head (or on paper!) and add.</p><p class="story">A shop sold 47 apples on Monday and 36 on Tuesday. How many in all?</p>${col('  ¹\n  4 7\n+ 3 6\n─────\n  8 3')}` },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'borrow', name: 'Borrow Bridge', icon: '🌉', color: '#ff595e',
      blurb: 'Column subtraction and borrowing',
      lessons: [
        {
          id: 'col-sub-nc', title: 'Subtracting in Columns', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [2, 2], regroup: 'none' },
          learn: [
            { title: 'Line them up', html: `<p>Write the bigger number on top. Line up the ones and tens. Subtract the <b>ones first</b>, then the tens.</p>${col('  5 8\n− 2 3\n─────\n  3 5')}` },
            { title: 'Watch: 58 − 23', demo: ['sub', 58, 23] },
            { title: 'Watch: 97 − 45', demo: ['sub', 97, 45] },
          ],
        },
        {
          id: 'col-sub-3nc', title: 'Subtracting 3-Digit Numbers', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [3, 3], regroup: 'none' },
          learn: [
            { title: 'Watch: 768 − 325', demo: ['sub', 768, 325] },
          ],
        },
        {
          id: 'col-sub-b', title: 'Borrowing', icon: '🤝', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [2, 2], regroup: 'some' },
          learn: [
            { title: 'When the top digit is too small', html: `<p>Look at 42 − 17. In the ones column, you can't take 7 from 2. So we <b>borrow</b> 1 ten from the tens column.</p>${col('  3 ¹2\n  4̶ \n− 1  7\n──────\n  2  5')}<p class="say">The 4 becomes 3, and the 2 becomes 12. Now 12 − 7 = 5, and 3 − 1 = 2.</p>` },
            { title: 'Watch: 42 − 17', demo: ['sub', 42, 17] },
            { title: 'Watch: 81 − 36', demo: ['sub', 81, 36] },
            { title: 'Remember', html: `<p>Cross out the digit you borrow from and write the new digit above it. Put a little 1 in front of the digit that gets the ten.</p><p class="say">Say it: "More on top, no need to stop. More on the floor, go next door and borrow ten more!"</p>` },
          ],
        },
        {
          id: 'col-sub-3b', title: 'Borrowing Twice', icon: '🤝', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [3, 3], regroup: 'some' },
          learn: [
            { title: 'Borrow again', html: `<p>With hundreds, you might borrow in the ones and again in the tens. Check each column: is the top digit big enough?</p>` },
            { title: 'Watch: 523 − 178', demo: ['sub', 523, 178] },
            { title: 'Watch: 634 − 259', demo: ['sub', 634, 259] },
          ],
        },
        {
          id: 'col-sub-zero', title: 'Borrowing Across Zeros', icon: '0️⃣', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [3, 3], regroup: 'some', zeros: true },
          learn: [
            { title: 'Nothing to borrow from?', html: `<p>In 300 − 47, the ones need to borrow, but the tens column is <b>0</b>. So go next door again: borrow from the hundreds first, then the tens can lend to the ones.</p>` },
            { title: 'Watch: 300 − 47', demo: ['sub', 300, 47] },
            { title: 'Watch: 405 − 128', demo: ['sub', 405, 128] },
          ],
        },
        {
          id: 'col-sub-big', title: 'Big Number Subtraction', icon: '🏔️', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'sub', digits: [4, 4], regroup: 'mixed' },
          learn: [
            { title: 'Watch: 5,213 − 2,867', demo: ['sub', 5213, 2867] },
          ],
        },
        {
          id: 'sub-words-big', title: 'Subtracting Stories', icon: '📖', practice: 4, quiz: 5,
          gen: { type: 'word', ops: ['add', 'sub'], max: 99 },
          learn: [
            { title: 'Story problems', html: `<p>Decide first: is it adding or taking away? Then set up the columns.</p><p class="story">There were 72 birds on a wire. 38 flew away. How many are left?</p>${col('  6 ¹2\n  7̶\n− 3  8\n──────\n  3  4')}` },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'multiplication', name: 'Multiplication Mountain', icon: '⛰️', color: '#6a4c93',
      blurb: 'Times tables and long multiplication',
      lessons: [
        {
          id: 'groups', title: 'Equal Groups', icon: '🍪', practice: 6, quiz: 8,
          gen: { type: 'groups', maxGroups: 5, maxEach: 5 },
          learn: [
            { title: 'What is multiplying?', html: `<p>Multiplying is a fast way to add <b>equal groups</b>.</p>${G('🍪', [4, 4, 4])}<p class="say">3 groups of 4 cookies. 4 + 4 + 4 = 12, so <b>3 × 4 = 12</b>.</p>` },
            { title: 'The times sign', html: `<p><b>×</b> means "groups of". 3 × 4 is "3 groups of 4".</p>${Vis.array('⭐', 3, 4)}<p class="say">3 rows of 4 stars = 12 stars.</p>` },
          ],
        },
        {
          id: 'x2510', title: '×2, ×5, ×10', icon: '✖️', practice: 8, quiz: 10,
          gen: { type: 'mulFacts', tables: [2, 5, 10], maxFactor: 10, visual: true },
          learn: [
            { title: 'The 2s', html: `<p>Times 2 is the same as doubling.</p><div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>2 × ${n} = ${2 * n}</span>`).join('')}</div>` },
            { title: 'The 5s and 10s', html: `<p>Times 5 ends in 5 or 0. Times 10 just adds a 0!</p><div class="factgrid">${[1, 2, 3, 4, 5, 6].map(n => `<span>5 × ${n} = ${5 * n}</span>`).join('')}${[1, 2, 3, 4, 5, 6].map(n => `<span>10 × ${n} = ${10 * n}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'x34', title: '×3 and ×4', icon: '✖️', practice: 8, quiz: 10,
          gen: { type: 'mulFacts', tables: [3, 4], maxFactor: 10, visual: true },
          learn: [
            { title: 'The 3s', html: `<div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>3 × ${n} = ${3 * n}</span>`).join('')}</div>` },
            { title: 'The 4s', html: `<p>Times 4 is double, then double again.</p><div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>4 × ${n} = ${4 * n}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'x67', title: '×6 and ×7', icon: '✖️', practice: 8, quiz: 10,
          gen: { type: 'mulFacts', tables: [6, 7], maxFactor: 10 },
          learn: [
            { title: 'The 6s', html: `<div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>6 × ${n} = ${6 * n}</span>`).join('')}</div>` },
            { title: 'The 7s', html: `<p>These are the trickiest — practice them the most!</p><div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>7 × ${n} = ${7 * n}</span>`).join('')}</div><p class="say">5, 6, 7, 8: 56 = 7 × 8!</p>` },
          ],
        },
        {
          id: 'x89', title: '×8 and ×9', icon: '✖️', practice: 8, quiz: 10,
          gen: { type: 'mulFacts', tables: [8, 9], maxFactor: 10 },
          learn: [
            { title: 'The 8s', html: `<div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>8 × ${n} = ${8 * n}</span>`).join('')}</div>` },
            { title: 'The 9s', html: `<p>The digits of every 9s answer add up to 9!</p><div class="factgrid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<span>9 × ${n} = ${9 * n}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'xall', title: 'All Tables to 12', icon: '🏆', practice: 10, quiz: 12,
          gen: { type: 'mulFacts', tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxFactor: 12 },
          learn: [
            { title: 'The 11s and 12s', html: `<div class="factgrid">${[3, 4, 5, 6, 7, 8, 9].map(n => `<span>11 × ${n} = ${11 * n}</span>`).join('')}${[3, 4, 5, 6, 7, 8, 9].map(n => `<span>12 × ${n} = ${12 * n}</span>`).join('')}</div>` },
            { title: 'Mixed practice', html: `<p>Now all the tables are mixed up. Answer as quickly as you can — but accuracy first!</p>` },
          ],
        },
        {
          id: 'mulwords', title: 'Multiplying Stories', icon: '📖', practice: 5, quiz: 6,
          gen: { type: 'word', ops: ['mul'], maxFactor: 9 },
          learn: [
            { title: 'Story problems', html: `<p>Clue words: <b>each</b>, <b>every</b>, <b>rows of</b>, <b>groups of</b>, <b>in all</b>.</p><p class="story">There are 4 boxes with 6 crayons in each box. How many crayons in all?</p>${eq('4 × 6 = 24')}` },
          ],
        },
        {
          id: 'col-mul-nc', title: 'Multiplying in Columns', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'mul', digits: [2, 1], regroup: 'none' },
          learn: [
            { title: 'Two digits times one digit', html: `<p>Write the big number on top. Multiply the one-digit number by the <b>ones</b>, then by the <b>tens</b>.</p>${col('  2 3\n×   3\n─────\n  6 9')}<p class="say">3 × 3 = 9 (ones). 3 × 2 = 6 (tens). Answer: 69.</p>` },
            { title: 'Watch: 23 × 3', demo: ['mul', 23, 3] },
            { title: 'Watch: 42 × 2', demo: ['mul', 42, 2] },
          ],
        },
        {
          id: 'col-mul-c', title: 'Multiplying with Carrying', icon: '🎒', practice: 4, quiz: 4,
          gen: { type: 'column', op: 'mul', digits: [2, 1], regroup: 'some' },
          learn: [
            { title: 'Carry when it\'s too big', html: `<p>If a product is 10 or more, write the ones digit and <b>carry</b> the tens digit above the next column — then add it after you multiply.</p>${col('  ²\n  4 7\n×   3\n─────\n1 4 1')}<p class="say">3 × 7 = 21 → write 1, carry 2. 3 × 4 = 12, plus 2 = 14. Answer: 141.</p>` },
            { title: 'Watch: 47 × 3', demo: ['mul', 47, 3] },
            { title: 'Watch: 68 × 4', demo: ['mul', 68, 4] },
          ],
        },
        {
          id: 'col-mul-3', title: '3 Digits × 1 Digit', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'mul', digits: [3, 1], regroup: 'mixed' },
          learn: [
            { title: 'Watch: 327 × 4', demo: ['mul', 327, 4] },
            { title: 'Watch: 589 × 6', demo: ['mul', 589, 6] },
          ],
        },
        {
          id: 'col-mul-2x2', title: 'Long Multiplication', icon: '📏', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'mul', digits: [2, 2], regroup: 'mixed' },
          learn: [
            { title: 'Two digits times two digits', html: `<p>Multiply by the <b>ones</b> digit first (one row). Then multiply by the <b>tens</b> digit — but first write a <b>0</b> as a placeholder because you're really multiplying by tens. Finally, <b>add</b> the two rows.</p>${col('    3 4\n×   2 7\n───────\n  2 3 8   ← 34 × 7\n  6 8 0   ← 34 × 20\n───────\n  9 1 8')}` },
            { title: 'Watch: 34 × 27', demo: ['mul', 34, 27] },
            { title: 'Watch: 56 × 43', demo: ['mul', 56, 43] },
          ],
        },
        {
          id: 'col-mul-3x2', title: '3 Digits × 2 Digits', icon: '🏔️', practice: 2, quiz: 3,
          gen: { type: 'column', op: 'mul', digits: [3, 2], regroup: 'mixed' },
          learn: [
            { title: 'Watch: 243 × 36', demo: ['mul', 243, 36] },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'division', name: 'Division Valley', icon: '🏞️', color: '#1982c4',
      blurb: 'Division facts and long division',
      lessons: [
        {
          id: 'sharing', title: 'Sharing Equally', icon: '🍕', practice: 6, quiz: 8,
          gen: { type: 'sharing', maxGroups: 5, maxEach: 5 },
          learn: [
            { title: 'What is dividing?', html: `<p>Dividing means sharing into <b>equal groups</b>.</p>${G('🍓', [4, 4, 4])}<p class="say">12 strawberries shared into 3 groups → 4 in each group. <b>12 ÷ 3 = 4</b></p>` },
            { title: 'The division sign', html: `<p><b>÷</b> means "shared into" or "split into". 12 ÷ 3 asks: 12 split into 3 equal groups is how many each?</p>` },
          ],
        },
        {
          id: 'd2510', title: '÷2, ÷5, ÷10', icon: '➗', practice: 8, quiz: 10,
          gen: { type: 'divFacts', tables: [2, 5, 10], maxQuotient: 10, visual: true },
          learn: [
            { title: 'Division undoes multiplication', html: `<p>If 5 × 3 = 15, then 15 ÷ 5 = 3 and 15 ÷ 3 = 5.</p><div class="factgrid">${[2, 4, 6, 8, 10].map(n => `<span>${n * 5} ÷ 5 = ${n}</span>`).join('')}</div><p class="say">Ask yourself: "5 times what equals 15?"</p>` },
          ],
        },
        {
          id: 'd34', title: '÷3 and ÷4', icon: '➗', practice: 8, quiz: 10,
          gen: { type: 'divFacts', tables: [3, 4], maxQuotient: 10 },
          learn: [
            { title: 'Use your tables', html: `${eq('28 ÷ 4 = ?')}<p>Think: 4 × ? = 28. You know 4 × 7 = 28, so 28 ÷ 4 = <b>7</b>.</p>` },
          ],
        },
        {
          id: 'd6789', title: '÷6, ÷7, ÷8, ÷9', icon: '➗', practice: 8, quiz: 10,
          gen: { type: 'divFacts', tables: [6, 7, 8, 9], maxQuotient: 10 },
          learn: [
            { title: 'Harder facts', html: `${eq('56 ÷ 7 = ?')}<p>7 × 8 = 56, so 56 ÷ 7 = <b>8</b>. Knowing your times tables makes division easy.</p>` },
          ],
        },
        {
          id: 'muldivfam', title: 'Multiply & Divide Families', icon: '👨‍👩‍👧', practice: 6, quiz: 8,
          gen: { type: 'mulDivFamily', maxFactor: 10 },
          learn: [
            { title: 'Fact families', html: `<p>3, 4, and 12 make a family:</p><div class="factgrid">${['3 × 4 = 12', '4 × 3 = 12', '12 ÷ 3 = 4', '12 ÷ 4 = 3'].map(s => `<span>${s}</span>`).join('')}</div>` },
          ],
        },
        {
          id: 'divwords', title: 'Dividing Stories', icon: '📖', practice: 5, quiz: 6,
          gen: { type: 'word', ops: ['mul', 'div'], maxFactor: 9 },
          learn: [
            { title: 'Story problems', html: `<p>Clue words: <b>share</b>, <b>equally</b>, <b>each</b>, <b>split</b>, <b>how many groups</b>.</p><p class="story">Ava shares 24 stickers equally among 4 friends. How many does each get?</p>${eq('24 ÷ 4 = 6')}` },
          ],
        },
        {
          id: 'ld-2', title: 'Long Division', icon: '📐', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'div', digits: [2], quotientDigits: 2, remainder: false },
          learn: [
            { title: 'The long division house', html: `<p>Write the number being divided (the <b>dividend</b>) inside the house, and the number you divide by (the <b>divisor</b>) outside. The answer (the <b>quotient</b>) goes on the roof.</p>${col('    2 1\n  ┌─────\n4 │ 8 4')}` },
            { title: 'Four steps, over and over', html: `<div class="dmsb"><div><b>D</b>ivide</div><div><b>M</b>ultiply</div><div><b>S</b>ubtract</div><div><b>B</b>ring down</div></div><p class="say">"<b>D</b>oes <b>M</b>cDonald's <b>S</b>ell <b>B</b>urgers?" Repeat until there are no more digits to bring down.</p>` },
            { title: 'Watch: 84 ÷ 4', demo: ['div', 84, 4] },
            { title: 'Watch: 96 ÷ 3', demo: ['div', 96, 3] },
          ],
        },
        {
          id: 'ld-rem', title: 'Remainders', icon: '🍰', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'div', digits: [2], quotientDigits: 2, remainder: 'mixed' },
          learn: [
            { title: 'Leftovers', html: `<p>Sometimes things don't split evenly. What's left over is the <b>remainder</b>. Write it as <b>R</b> next to the quotient.</p>${col('    1 3 R 2\n  ┌─────\n5 │ 6 7')}<p class="say">67 ÷ 5 = 13 with 2 left over.</p>` },
            { title: 'Watch: 67 ÷ 5', demo: ['div', 67, 5] },
            { title: 'Watch: 59 ÷ 4', demo: ['div', 59, 4] },
          ],
        },
        {
          id: 'ld-3', title: '3-Digit Long Division', icon: '📐', practice: 3, quiz: 4,
          gen: { type: 'column', op: 'div', digits: [3], quotientDigits: 2, remainder: 'mixed' },
          learn: [
            { title: 'Starting small', html: `<p>If the divisor doesn't fit into the first digit, look at the first <b>two</b> digits together.</p>` },
            { title: 'Watch: 258 ÷ 6', demo: ['div', 258, 6] },
            { title: 'Watch: 735 ÷ 4', demo: ['div', 735, 4] },
          ],
        },
        {
          id: 'ld-4', title: 'Big Long Division', icon: '🏔️', practice: 2, quiz: 3,
          gen: { type: 'column', op: 'div', digits: [4], quotientDigits: 3, remainder: 'mixed', zerosOk: true },
          learn: [
            { title: 'Zeros in the answer', html: `<p>Sometimes the divisor doesn't fit after you bring down. Write a <b>0</b> in the quotient and bring down the next digit.</p>` },
            { title: 'Watch: 3,624 ÷ 6', demo: ['div', 3624, 6] },
            { title: 'Watch: 4,157 ÷ 8', demo: ['div', 4157, 8] },
          ],
        },
        {
          id: 'ld-2div', title: '2-Digit Divisors', icon: '🐉', practice: 2, quiz: 3,
          gen: { type: 'column', op: 'div', digits: [3], divisorDigits: 2, maxDivisor: 25, quotientDigits: 2, remainder: 'mixed' },
          learn: [
            { title: 'Dividing by bigger numbers', html: `<p>Same four steps. To guess how many times, round: for 12, think "about 10". Then check by multiplying.</p>` },
            { title: 'Watch: 384 ÷ 12', demo: ['div', 384, 12] },
          ],
        },
      ],
    },
    /* ------------------------------------------------------------------ */
    {
      id: 'castle', name: 'Challenge Castle', icon: '🏰', color: '#ff70a6',
      blurb: 'Mixed review of everything',
      lessons: [
        {
          id: 'rev-facts', title: 'All the Facts', icon: '⚡', practice: 8, quiz: 12,
          gen: { type: 'mixed', gens: [{ type: 'addFacts', max: 20 }, { type: 'subFacts', max: 20 }, { type: 'mulFacts', tables: [2, 3, 4, 5, 6, 7, 8, 9], maxFactor: 10 }, { type: 'divFacts', tables: [2, 3, 4, 5, 6, 7, 8, 9], maxQuotient: 10 }] },
          learn: [{ title: 'Everything mixed', html: `<p>Addition, subtraction, multiplication, and division — all mixed together. Look at the sign carefully!</p>` }],
        },
        {
          id: 'rev-columns', title: 'Column Champion', icon: '🧮', practice: 3, quiz: 4,
          gen: { type: 'mixed', gens: [{ type: 'column', op: 'add', digits: [3, 3], regroup: 'mixed' }, { type: 'column', op: 'sub', digits: [3, 3], regroup: 'mixed' }, { type: 'column', op: 'mul', digits: [2, 1], regroup: 'mixed' }, { type: 'column', op: 'div', digits: [2], quotientDigits: 2, remainder: 'mixed' }] },
          learn: [{ title: 'Mixed written methods', html: `<p>Carrying, borrowing, multiplying, and long division. Read the sign, then use the right method.</p>` }],
        },
        {
          id: 'rev-words', title: 'Story Master', icon: '📚', practice: 5, quiz: 6,
          gen: { type: 'word', ops: ['add', 'sub', 'mul', 'div'], max: 50, maxFactor: 9 },
          learn: [{ title: 'Which operation?', html: `<p>Every story hides an operation. Find the clue words, choose +, −, ×, or ÷, and solve.</p>` }],
        },
        {
          id: 'rev-big', title: 'Grand Finale', icon: '👑', practice: 2, quiz: 4,
          gen: { type: 'mixed', gens: [{ type: 'column', op: 'add', digits: [4, 4], regroup: 'mixed' }, { type: 'column', op: 'sub', digits: [4, 4], regroup: 'mixed' }, { type: 'column', op: 'mul', digits: [2, 2], regroup: 'mixed' }, { type: 'column', op: 'div', digits: [3], quotientDigits: 2, remainder: 'mixed' }] },
          learn: [{ title: 'The final challenge', html: `<p>The biggest problems in Number Quest. You've learned everything you need. Go get that crown! 👑</p>` }],
        },
      ],
    },
  ];

  const LESSONS = [];
  WORLDS.forEach((w, wi) => w.lessons.forEach((l, li) => { l.world = w; l.index = li; l.worldIndex = wi; LESSONS.push(l); }));
  const lessonById = id => LESSONS.find(l => l.id === id);
  const worldById = id => WORLDS.find(w => w.id === id);

  // A lesson is unlocked when the previous lesson in the same world has at least 1 star,
  // or it is the first lesson of a world whose previous world has been started (2+ lessons passed).
  function isUnlocked(profile, lesson) {
    if (Store.settings.unlockAll) return true;
    const w = lesson.world;
    if (lesson.index > 0) {
      const prev = w.lessons[lesson.index - 1];
      return (profile.lessons[prev.id] || {}).stars > 0;
    }
    if (lesson.worldIndex === 0) return true;
    const prevWorld = WORLDS[lesson.worldIndex - 1];
    const passed = prevWorld.lessons.filter(l => (profile.lessons[l.id] || {}).stars > 0).length;
    return passed >= Math.min(2, prevWorld.lessons.length);
  }
  function nextLesson(profile) {
    return LESSONS.find(l => isUnlocked(profile, l) && !((profile.lessons[l.id] || {}).stars > 0)) || LESSONS.find(l => (profile.lessons[l.id] || {}).stars < 3) || LESSONS[LESSONS.length - 1];
  }
  function worldProgress(profile, world) {
    const stars = world.lessons.reduce((s, l) => s + ((profile.lessons[l.id] || {}).stars || 0), 0);
    const done = world.lessons.filter(l => (profile.lessons[l.id] || {}).stars > 0).length;
    return { stars, maxStars: world.lessons.length * 3, done, total: world.lessons.length };
  }

  return { WORLDS, LESSONS, lessonById, worldById, isUnlocked, nextLesson, worldProgress };
})();

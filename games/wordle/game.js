// Wordle Game

// Word lists
const WORD_LIST = [
    'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
    'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alike', 'alive',
    'allow', 'alone', 'along', 'alter', 'among', 'angel', 'anger', 'angle', 'angry', 'apart',
    'apple', 'apply', 'arena', 'argue', 'arise', 'armor', 'army', 'array', 'arrow', 'asset',
    'avoid', 'award', 'aware', 'badly', 'baker', 'bases', 'basic', 'basis', 'beach', 'began',
    'begin', 'being', 'belly', 'below', 'bench', 'birth', 'black', 'blade', 'blame', 'blank',
    'blast', 'blaze', 'bleed', 'blend', 'bless', 'blind', 'block', 'blood', 'bloom', 'blown',
    'board', 'boost', 'booth', 'bound', 'brain', 'brand', 'brass', 'brave', 'bread', 'break',
    'breed', 'brick', 'bride', 'brief', 'bring', 'broad', 'broke', 'brook', 'brown', 'brush',
    'build', 'built', 'bunch', 'burst', 'buyer', 'cabin', 'cable', 'camel', 'camp', 'canal',
    'candy', 'cargo', 'carry', 'catch', 'cause', 'cease', 'chain', 'chair', 'champ', 'chant',
    'chaos', 'charm', 'chart', 'chase', 'cheap', 'cheat', 'check', 'cheek', 'cheer', 'chess',
    'chest', 'chief', 'child', 'chill', 'china', 'chirp', 'choir', 'chose', 'chunk', 'claim',
    'clamp', 'clash', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb', 'cling',
    'clock', 'clone', 'close', 'cloth', 'cloud', 'coach', 'coast', 'could', 'count', 'court',
    'cover', 'crack', 'craft', 'crane', 'crash', 'crawl', 'crazy', 'cream', 'creek', 'creep',
    'crest', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'cruel', 'crush', 'curve', 'cycle',
    'daily', 'dairy', 'dance', 'dealt', 'death', 'debut', 'decay', 'delay', 'delta', 'dense',
    'depth', 'diary', 'dirty', 'doubt', 'dough', 'dozen', 'draft', 'drain', 'drama', 'drank',
    'drawl', 'dream', 'dress', 'dried', 'drift', 'drill', 'drink', 'drive', 'droit', 'drone',
    'drown', 'drunk', 'dying', 'eager', 'early', 'earth', 'eight', 'elder', 'elect', 'elite',
    'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'equip', 'erase', 'error', 'essay',
    'event', 'every', 'exact', 'exalt', 'exist', 'extra', 'faint', 'fairy', 'faith', 'false',
    'fancy', 'fatal', 'fault', 'feast', 'fence', 'fever', 'fiber', 'field', 'fiery', 'fifth',
    'fifty', 'fight', 'final', 'first', 'fixed', 'flame', 'flash', 'fleet', 'flesh', 'float',
    'flock', 'flood', 'floor', 'flour', 'flown', 'fluid', 'flush', 'focus', 'force', 'forge',
    'forth', 'forty', 'forum', 'fossil', 'found', 'frame', 'frank', 'fraud', 'freak', 'fresh',
    'front', 'frost', 'fruit', 'fully', 'funny', 'ghost', 'giant', 'given', 'glass', 'globe',
    'glory', 'glove', 'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'grape', 'grasp',
    'grass', 'grave', 'great', 'greed', 'greek', 'green', 'greet', 'grief', 'grill', 'grind',
    'groan', 'groom', 'gross', 'group', 'grove', 'growl', 'grown', 'guard', 'guess', 'guest',
    'guide', 'guild', 'guilt', 'habit', 'happy', 'harsh', 'haste', 'haven', 'heart', 'heavy',
    'hence', 'hobby', 'honey', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'hurry',
    'ideal', 'image', 'imply', 'index', 'inner', 'input', 'issue', 'jewel', 'joint', 'joker',
    'jolly', 'joust', 'judge', 'juice', 'juicy', 'jumbo', 'kayak', 'khaki', 'knock', 'known',
    'label', 'labor', 'lance', 'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease',
    'least', 'leave', 'legal', 'lemon', 'level', 'lever', 'light', 'limit', 'linen', 'links',
    'liver', 'lives', 'local', 'lodge', 'logic', 'login', 'loose', 'lorry', 'loser', 'lotus',
    'lover', 'lower', 'loyal', 'lucky', 'lunar', 'lunch', 'lying', 'lyric', 'magic', 'major',
    'maker', 'manor', 'maple', 'march', 'marry', 'marsh', 'match', 'maybe', 'mayor', 'medal',
    'media', 'melon', 'mercy', 'merge', 'merit', 'merry', 'metal', 'meter', 'midst', 'might',
    'mimic', 'mince', 'minor', 'minus', 'mixed', 'model', 'modem', 'moist', 'money', 'month',
    'moral', 'moron', 'motor', 'mount', 'mouse', 'mouth', 'movie', 'muddy', 'music', 'naked',
    'nasty', 'naval', 'nerve', 'never', 'night', 'ninth', 'noble', 'noise', 'north', 'notch',
    'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'olive', 'onion', 'onset',
    'opera', 'orbit', 'order', 'organ', 'other', 'ought', 'outer', 'owned', 'owner', 'oxide',
    'ozone', 'paint', 'panel', 'panic', 'paper', 'party', 'pasta', 'paste', 'patch', 'pause',
    'peace', 'peach', 'pearl', 'penny', 'perch', 'peril', 'petty', 'phase', 'phone', 'photo',
    'piano', 'piece', 'pilot', 'pinch', 'pitch', 'pizza', 'place', 'plain', 'plane', 'plant',
    'plate', 'plaza', 'plead', 'plumb', 'plume', 'plump', 'point', 'poise', 'polar', 'polka',
    'pouch', 'pound', 'power', 'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize',
    'probe', 'prone', 'proof', 'prose', 'proud', 'prove', 'proxy', 'pulse', 'punch', 'pupil',
    'purse', 'queen', 'query', 'quest', 'queue', 'quick', 'quiet', 'quilt', 'quota', 'quote',
    'rabbi', 'radar', 'radio', 'raise', 'rally', 'ranch', 'range', 'rapid', 'ratio', 'reach',
    'react', 'ready', 'realm', 'rebel', 'refer', 'reign', 'relax', 'relay', 'reply', 'rhyme',
    'ridge', 'rifle', 'right', 'rigid', 'rigor', 'rinse', 'ripen', 'risen', 'risky', 'rival',
    'river', 'roast', 'robot', 'rocky', 'roman', 'roost', 'rough', 'round', 'route', 'royal',
    'rugby', 'ruler', 'rural', 'sadly', 'saint', 'salad', 'salon', 'sandy', 'sauce', 'scale',
    'scare', 'scarf', 'scary', 'scene', 'scent', 'scope', 'score', 'scout', 'scrap', 'seize',
    'sense', 'serve', 'seven', 'shade', 'shake', 'shall', 'shame', 'shape', 'share', 'shark',
    'sharp', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt', 'shock',
    'shoot', 'shore', 'short', 'shout', 'shown', 'shrug', 'siege', 'sight', 'sigma', 'silly',
    'since', 'sixth', 'sixty', 'sized', 'skate', 'skill', 'skull', 'slash', 'slate', 'slave',
    'sleek', 'sleep', 'slice', 'slide', 'slope', 'slump', 'small', 'smart', 'smell', 'smile',
    'smoke', 'snake', 'snare', 'sneak', 'solar', 'solid', 'solve', 'sorry', 'sound', 'south',
    'space', 'spare', 'spark', 'speak', 'spear', 'speed', 'spell', 'spend', 'spice', 'spill',
    'spine', 'spite', 'split', 'spoke', 'spoon', 'sport', 'spray', 'squad', 'stack', 'staff',
    'stage', 'stain', 'stair', 'stake', 'stale', 'stamp', 'stand', 'stare', 'stark', 'start',
    'state', 'stays', 'steak', 'steal', 'steam', 'steel', 'steep', 'steer', 'stern', 'stick',
    'stiff', 'still', 'sting', 'stock', 'stomp', 'stone', 'stool', 'store', 'storm', 'story',
    'stout', 'stove', 'strap', 'straw', 'stray', 'strip', 'stuck', 'study', 'stuff', 'stump',
    'style', 'sugar', 'suite', 'sunny', 'super', 'surge', 'swamp', 'swarm', 'swear', 'sweat',
    'sweep', 'sweet', 'swell', 'swept', 'swift', 'swing', 'sword', 'swore', 'sworn', 'syrup',
    'table', 'tacit', 'taken', 'taste', 'tasty', 'teach', 'teddy', 'teeth', 'tempt', 'tenor',
    'tense', 'tenth', 'terms', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick',
    'thief', 'thing', 'think', 'third', 'thorn', 'those', 'three', 'threw', 'throw', 'thumb',
    'tiger', 'tight', 'timer', 'tired', 'title', 'toast', 'today', 'token', 'topic', 'torch',
    'total', 'touch', 'tough', 'tower', 'toxic', 'trace', 'track', 'trade', 'trail', 'train',
    'trait', 'trash', 'treat', 'trend', 'trial', 'tribe', 'trick', 'tried', 'troop', 'trout',
    'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tumor', 'tuner', 'twice', 'twist',
    'ultra', 'uncle', 'under', 'undue', 'unfed', 'unfit', 'union', 'unite', 'unity', 'until',
    'upper', 'upset', 'urban', 'usage', 'usual', 'utter', 'vague', 'valid', 'value', 'vapor',
    'vault', 'venue', 'verse', 'video', 'vigor', 'viral', 'virus', 'visit', 'vista', 'vital',
    'vivid', 'vocal', 'vodka', 'vogue', 'voice', 'voter', 'vouch', 'waist', 'watch', 'water',
    'weary', 'weave', 'wedge', 'weigh', 'weird', 'whale', 'wheat', 'wheel', 'where', 'which',
    'while', 'white', 'whole', 'whose', 'widen', 'widow', 'width', 'witch', 'woman', 'world',
    'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'woven', 'wrath', 'wreck', 'wrist',
    'write', 'wrong', 'wrote', 'yacht', 'yearn', 'yeast', 'yield', 'young', 'youth', 'zebra',
    'zesty', 'zones'
];

class Wordle {
    constructor() {
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        this.answerText = document.getElementById('answer-text');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.winsDisplay = document.getElementById('wins');
        this.streakDisplay = document.getElementById('streak');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');

        // Game state
        this.targetWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.guesses = [];
        this.keyStates = {};

        // Stats
        this.wins = 0;
        this.streak = 0;

        // Initialize
        this.loadSettings();
        this.createBoard();
        this.bindEvents();
        this.startNewGame();
    }

    loadSettings() {
        // Load theme
        const savedTheme = localStorage.getItem('game-hub-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Load stats
        const savedWins = localStorage.getItem('wordle-wins');
        const savedStreak = localStorage.getItem('wordle-streak');
        if (savedWins) this.wins = parseInt(savedWins);
        if (savedStreak) this.streak = parseInt(savedStreak);

        this.updateStatsDisplay();
    }

    createBoard() {
        this.board.innerHTML = '';
        for (let row = 0; row < 6; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            for (let col = 0; col < 5; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                rowDiv.appendChild(tile);
            }
            this.board.appendChild(rowDiv);
        }
    }

    bindEvents() {
        // Physical keyboard
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Virtual keyboard
        this.keyboard.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                this.handleInput(keyValue);
            });
        });

        // Buttons
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    handleKeyPress(e) {
        if (this.gameOver) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleInput('ENTER');
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.handleInput('BACKSPACE');
        } else if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            this.handleInput(e.key.toUpperCase());
        }
    }

    handleInput(key) {
        if (this.gameOver) return;

        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (/^[A-Z]$/.test(key) && this.currentCol < 5) {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        const tile = this.getTile(this.currentRow, this.currentCol);
        tile.textContent = letter;
        tile.classList.add('filled');
        this.currentCol++;
    }

    deleteLetter() {
        if (this.currentCol > 0) {
            this.currentCol--;
            const tile = this.getTile(this.currentRow, this.currentCol);
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }

    submitGuess() {
        if (this.currentCol !== 5) {
            this.shakeRow();
            return;
        }

        const guess = this.getCurrentGuess();

        // Check if it's a valid word (in our word list)
        if (!WORD_LIST.includes(guess.toLowerCase())) {
            this.shakeRow();
            return;
        }

        this.guesses.push(guess);
        this.revealTiles(guess);
    }

    getCurrentGuess() {
        let guess = '';
        for (let col = 0; col < 5; col++) {
            const tile = this.getTile(this.currentRow, col);
            guess += tile.textContent;
        }
        return guess;
    }

    revealTiles(guess) {
        const target = this.targetWord.toUpperCase();
        const guessArr = guess.split('');
        const targetArr = target.split('');
        const results = new Array(5).fill('absent');
        const targetCount = {};

        // Count letters in target
        for (const letter of targetArr) {
            targetCount[letter] = (targetCount[letter] || 0) + 1;
        }

        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === targetArr[i]) {
                results[i] = 'correct';
                targetCount[guessArr[i]]--;
            }
        }

        // Second pass: mark present letters
        for (let i = 0; i < 5; i++) {
            if (results[i] !== 'correct' && targetCount[guessArr[i]] > 0) {
                results[i] = 'present';
                targetCount[guessArr[i]]--;
            }
        }

        // Reveal tiles with animation
        for (let i = 0; i < 5; i++) {
            const tile = this.getTile(this.currentRow, i);
            const result = results[i];
            const letter = guessArr[i];

            setTimeout(() => {
                tile.classList.add('reveal', result);

                // Update keyboard
                this.updateKeyState(letter, result);
            }, i * 300);
        }

        // Check for win/loss after animations
        setTimeout(() => {
            if (guess === target) {
                this.handleWin();
            } else if (this.currentRow === 5) {
                this.handleLoss();
            } else {
                this.currentRow++;
                this.currentCol = 0;
            }
        }, 5 * 300 + 300);
    }

    updateKeyState(letter, result) {
        const currentState = this.keyStates[letter];

        // Only upgrade state: absent -> present -> correct
        if (currentState === 'correct') return;
        if (currentState === 'present' && result !== 'correct') return;

        this.keyStates[letter] = result;

        const key = this.keyboard.querySelector(`[data-key="${letter}"]`);
        if (key) {
            key.classList.remove('absent', 'present', 'correct');
            key.classList.add(result);
        }
    }

    getTile(row, col) {
        return this.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    shakeRow() {
        const row = this.board.children[this.currentRow];
        row.querySelectorAll('.tile').forEach(tile => {
            tile.classList.add('shake');
            setTimeout(() => tile.classList.remove('shake'), 500);
        });
    }

    handleWin() {
        this.gameOver = true;
        this.wins++;
        this.streak++;
        this.saveStats();
        this.updateStatsDisplay();

        // Bounce animation
        const row = this.board.children[this.currentRow];
        row.querySelectorAll('.tile').forEach((tile, i) => {
            setTimeout(() => tile.classList.add('bounce'), i * 100);
        });

        setTimeout(() => {
            const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
            this.messageText.textContent = `🎉 ${messages[this.currentRow]}`;
            this.answerText.textContent = `The word was: ${this.targetWord.toUpperCase()}`;
            this.gameMessage.classList.remove('hidden');
        }, 1500);

        // Record recent play
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('wordle');
        }
    }

    handleLoss() {
        this.gameOver = true;
        this.streak = 0;
        this.saveStats();
        this.updateStatsDisplay();

        this.messageText.textContent = '😢 Game Over';
        this.answerText.textContent = `The word was: ${this.targetWord.toUpperCase()}`;
        this.gameMessage.classList.remove('hidden');

        // Record recent play
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('wordle');
        }
    }

    saveStats() {
        localStorage.setItem('wordle-wins', this.wins);
        localStorage.setItem('wordle-streak', this.streak);
    }

    updateStatsDisplay() {
        this.winsDisplay.textContent = this.wins;
        this.streakDisplay.textContent = this.streak;
    }

    startNewGame() {
        // Reset state
        this.targetWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.guesses = [];
        this.keyStates = {};

        // Reset board
        this.createBoard();

        // Reset keyboard
        this.keyboard.querySelectorAll('.key').forEach(key => {
            key.classList.remove('absent', 'present', 'correct');
        });

        // Hide message
        this.gameMessage.classList.add('hidden');

        // Record recent play
        if (typeof recordRecentPlay === 'function') {
            recordRecentPlay('wordle');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('game-hub-theme', isDark ? 'dark' : 'light');
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Wordle();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Wordle, WORD_LIST };
}

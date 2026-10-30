/*aicore-client-errors*/(function(){var n=GetCurrentResourceName(),s={},c=0;var r=function(t){t=String(t).replace(/\^\d/g,"");var k=t.slice(0,300);if(s[k]||c>=20)return;s[k]=1;c++;try{TriggerServerEvent("ai-core:clientError",n,t.slice(0,4000))}catch(e){}};globalThis.__aicoreReportError=r;var l=console.log;console.log=function(){var a=arguments[0];if(typeof a==="string"&&a.indexOf("SCRIPT ERROR")!==-1)r(a);return l.apply(console,arguments)}})();
try{
(function() {

// ../../../packages/lib/src/fivem/callbackNames.ts
/**
	* Callback wire format, the same on both sides:
	*   request  `aicore:cb:<name>`              (callerResource, id, ...args)
	*   response `aicore:cbr:<callerResource>`   (id, ok, result)
	* The response goes only to the resource that asked, so two resources never see each other's replies.
	*/
	const requestEvent = (name) => `aicore:cb:${name}`;
	const responseEvent = (resource) => `aicore:cbr:${resource}`;
	/** Default time a caller waits for an answer before the promise rejects. */
	const DEFAULT_CALLBACK_TIMEOUT = 3e4;

// ../../../packages/lib/src/shared/read.ts
/** The value as a plain object, or an empty one. */
	function record(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
	}

// ../../../packages/lib/src/shared/index.ts
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	/** Fills `{0}`, `{1}`... with the arguments by position (a translation may reorder or repeat them). */
	function formatText(template, args) {
		return template.replace(/\{(\d+)\}/g, (match, index) => {
			const value = args[Number(index)];
			return value === void 0 ? match : String(value);
		});
	}
	/** Console output prefixed with the resource name, so server logs show where a line came from. */
	function createLogger(resource) {
		const prefix = `[${resource}]`;
		return {
			info: (message, ...details) => console.log(`${prefix} ${message}`, ...details),
			warn: (message, ...details) => console.warn(`${prefix} ^3${message}^7`, ...details),
			error: (message, ...details) => console.error(`${prefix} ^1${message}^7`, ...details)
		};
	}

// ../../../packages/lib/src/client/netEvent.ts
	const log$2 = createLogger(GetCurrentResourceName());
	/**
	* Whether the net event being handled came from the server (read it before the first `await`). On a client only
	* events from the server carry a source (65535 in the docs); a local emit by any resource carries none.
	*/
	const fromServer = () => Boolean(globalThis.source);

// ../../../packages/lib/src/client/callback.ts
	const resource = GetCurrentResourceName();
	const log$1 = createLogger(resource);
	const pending = /* @__PURE__ */ new Map();
	let nextId = 0;
	onNet(responseEvent(resource), (id, ok, result) => {
		if (!fromServer()) return;
		const entry = typeof id === "number" ? pending.get(id) : void 0;
		if (!entry) return;
		pending.delete(id);
		clearTimeout(entry.timer);
		if (ok === true) entry.resolve(result);
		else entry.reject(/* @__PURE__ */ new Error("server callback failed"));
	});
	/**
	* Asks the server (`onClientCallback(name, ...)` there) and resolves with its answer. The answer is unknown:
	* parse it. Rejects when the server reports an error or does not answer within `timeoutMs`.
	*/
	function triggerServerCallback(name, args = [], timeoutMs = DEFAULT_CALLBACK_TIMEOUT) {
		const id = ++nextId;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				pending.delete(id);
				reject(/* @__PURE__ */ new Error(`server callback ${name} timed out`));
			}, timeoutMs);
			pending.set(id, {
				resolve,
				reject,
				timer
			});
			emitNet(requestEvent(name), resource, id, ...args);
		});
	}

// ../../../packages/shared/src/core.ts
/** Names owned by ai-core that other resources, the bridges and the build step use. */
	const CORE = {
		resource: "ai-core",
		/** Client -> server: (resource: string, text: string). Sent by the reporter every client bundle carries. */
		clientErrorEvent: "ai-core:clientError",
		/** (src, character: CharacterInfo) after a character is loaded and spawned. */
		playerLoadedEvent: "ai-core:playerLoaded",
		/** (src, charId, reason: UnloadReason) before a character's state is dropped. */
		playerUnloadedEvent: "ai-core:playerUnloaded",
		/** (src, account: string, balance: number, delta: number, reason: string) */
		moneyChangedEvent: "ai-core:moneyChanged",
		/** (src, jobs: JobMembership[]) */
		jobsChangedEvent: "ai-core:jobsChanged",
		/** (src, job: string | null) */
		dutyChangedEvent: "ai-core:dutyChanged",
		/** (src, gangs: GangMembership[]) */
		gangsChangedEvent: "ai-core:gangsChanged",
		/** (src, gang: string | null) */
		activeGangChangedEvent: "ai-core:activeGangChanged",
		/** (src, charIds: number[]) each time a player's character screen loads; an appearance resource answers with portraits. */
		characterScreenEvent: "ai-core:characterScreen",
		clientPlayerLoadedEvent: "ai-core:client:playerLoaded",
		clientPlayerUnloadedEvent: "ai-core:client:playerUnloaded",
		/** (charId: number, url: string) a portrait image of a character on the character screen (e.g. `https://nui-img/<txd>/<txd>`). */
		clientCharacterPortraitEvent: "ai-core:client:characterPortrait",
		/** (resource: string, id: string) the interaction key was pressed while that resource's prompt was on top. */
		clientPromptPressedEvent: "ai-core:client:promptPressed",
		/** (key: keyof PlayerCache, value) a cached value of the local player changed (one watcher in ai-core for every resource). */
		clientCacheEvent: "ai-core:client:cache",
		charactersCallback: "ai-core:characters",
		createCharacterCallback: "ai-core:createCharacter",
		deleteCharacterCallback: "ai-core:deleteCharacter",
		selectCharacterCallback: "ai-core:selectCharacter",
		/** Server -> client: (notification: Notification) a notification card on the player's screen. */
		clientNotifyEvent: "ai-core:client:notify",
		/** Server -> client: (spawn: SpawnPoint) puts the loaded character into the world. */
		spawnEvent: "ai-core:client:spawn",
		/** Server -> client: () the character was let go (switch); show the character screen again. */
		openCharactersEvent: "ai-core:client:openCharacters"
	};

// ../../../packages/shared/src/menu.ts
	const MENU_EVENTS = {
		/** Client local: (resource, requestId, itemId | null) the player picked an item or closed the menu. */
		menuResult: "ai-core:client:menuResult",
		/** Client local: (resource, requestId, itemId) the pointer or focus is on an item (previews). */
		menuHover: "ai-core:client:menuHover",
		/** Client local: (resource, requestId, values | null) the player confirmed or closed the input dialog. */
		inputResult: "ai-core:client:inputResult"
	};

// ../../../packages/lib/src/client/cache.ts
/** The unarmed "weapon" hash: cached as `false`. */
	const UNARMED = GetHashKey("WEAPON_UNARMED") | 0;
	/** The vehicle, seat and weapon of a ped right now (also ai-core's watcher). */
	function readPlayerState(ped) {
		const vehicle = GetVehiclePedIsIn(ped, false);
		let seat = false;
		if (vehicle) for (let i = -1; i < GetVehicleMaxNumberOfPassengers(vehicle); i++) {
			if (GetPedInVehicleSeat(vehicle, i) !== ped) continue;
			seat = i;
			break;
		}
		const weapon = GetSelectedPedWeapon(ped) | 0;
		return {
			vehicle: vehicle || false,
			seat,
			weapon: weapon === UNARMED ? false : weapon
		};
	}
	/**
	* The local player's often read values (ped, player id, server id, vehicle, seat, weapon), like ox_lib's `cache`:
	* read `cache.ped` instead of calling PlayerPedId() in loops. One watcher in ai-core updates every resource through
	* a local event, so no resource polls for these itself. Read only.
	*/
	const ped = PlayerPedId();
	const cache = {
		ped,
		playerId: PlayerId(),
		serverId: GetPlayerServerId(PlayerId()),
		...readPlayerState(ped)
	};
	const handlers = /* @__PURE__ */ new Map();
	const valid = (key, value) => key === "ped" || key === "playerId" || key === "serverId" ? typeof value === "number" : typeof value === "number" || value === false;
	on(CORE.clientCacheEvent, (key, value) => {
		if (typeof key !== "string" || !(key in cache)) return;
		const name = key;
		if (!valid(name, value) || cache[name] === value) return;
		const old = cache[name];
		cache[name] = value;
		for (const handler of handlers.get(name) ?? []) handler(value, old);
	});

// ../../../packages/lib/src/client/zones.ts
/**
	* Zones on this client: inside / outside checks at each zone's own interval, never per frame. Built for any count
	* (measured with 1,000,000 zones): zones sit in a grid of 64 m cells and a check looks only at the player's cell and
	* the zones the player is in.
	*/
	const log = createLogger(GetCurrentResourceName());

// ../../../packages/lib/src/client/menu.ts
/** Menus and input dialogs this resource asked ai-core for, waiting for the player's answer. */
	var Requests = class {
		resource = GetCurrentResourceName();
		waiting = /* @__PURE__ */ new Map();
		hovers = /* @__PURE__ */ new Map();
		nextId = 0;
		constructor() {
			const answer = (owner, id, value) => {
				if (owner !== this.resource || typeof id !== "number") return;
				this.waiting.get(id)?.(value);
				this.waiting.delete(id);
				this.hovers.delete(id);
			};
			on(MENU_EVENTS.menuHover, (owner, id, item) => {
				if (owner === this.resource && typeof id === "number" && typeof item === "string") this.hovers.get(id)?.(item);
			});
			on(MENU_EVENTS.menuResult, answer);
			on(MENU_EVENTS.inputResult, answer);
		}
		ask(open, read, onHover) {
			const id = ++this.nextId;
			this.waiting.set(id, read);
			if (onHover) this.hovers.set(id, onHover);
			open(id);
		}
	};
	const requests = new Requests();

// ../../../packages/lib/src/client/vehicleProps.ts
	const MOD_TYPES = Array.from({ length: 50 }, (_, i) => i);

// ../../../packages/lib/src/client/keybind.ts
/** A key the player can rebind in GTA's settings (RegisterKeyMapping); no per-frame key polling. */
	var Keybind = class {
		options;
		name;
		disabled;
		pressed = false;
		hash;
		constructor(options) {
			this.options = options;
			this.name = options.name;
			this.disabled = options.disabled ?? false;
			this.hash = GetHashKey(`+${options.name}`) | 2147483648;
			RegisterCommand(`+${options.name}`, () => this.press(true), false);
			RegisterCommand(`-${options.name}`, () => this.press(false), false);
			RegisterKeyMapping(`+${options.name}`, options.description, options.defaultMapper ?? "keyboard", options.defaultKey ?? "");
			setTimeout(() => {
				emit("chat:removeSuggestion", `/+${options.name}`);
				emit("chat:removeSuggestion", `/-${options.name}`);
			}, 500);
		}
		press(down) {
			if (this.disabled || !this.options.allowInPauseMenu && IsPauseMenuActive()) return;
			this.pressed = down;
			if (down) this.options.onPressed?.();
			else this.options.onReleased?.();
		}
		/** Whether the key is held now. */
		get isPressed() {
			return this.pressed;
		}
		/** The key the player has bound right now, for HUD hints. */
		get currentKey() {
			return GetControlInstructionalButton(0, this.hash, true).substring(2);
		}
		disable(disabled) {
			this.disabled = disabled;
			this.pressed = false;
		}
	};

// ../../../packages/lib/src/fivem/locale.ts
/** Convar holding the language (`setr ai:locale "en"` in misc.cfg); replicated so clients read it too. */
	const LOCALE_CONVAR = "ai:locale";
	function readLocaleFile(resource, lang) {
		const raw = LoadResourceFile(resource, `locales/${lang}.json`);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!isRecord(parsed)) return {};
		const texts = {};
		for (const [key, value] of Object.entries(parsed)) if (typeof value === "string") texts[key] = value;
		return texts;
	}
	/**
	* The resource's lang texts: `locales/en.json` (complete base) overlaid with `locales/<ai:locale>.json`.
	* `${OTHER_KEY}` inside a text is replaced by that text once at load. Returns `t(key, ...args)` filling
	* `{0}`, `{1}`...; a missing key returns the key itself so it is visible in game.
	*
	*   const t = createLocale<typeof import("../../locales/en.json")>();
	*   t("NOTIFY_NO_MONEY", price);
	*/
	function createLocale() {
		const texts = loadLocaleTexts();
		return (key, ...args) => formatText(texts[key] ?? key, args);
	}
	/**
	* The resource's merged lang table (`en.json` overlaid with the `ai:locale` language, `${KEY}` references
	* resolved). A NUI gets this once and fills `{0}` placeholders itself.
	*/
	function loadLocaleTexts(resource = GetCurrentResourceName()) {
		const lang = GetConvar(LOCALE_CONVAR, "en");
		const texts = {
			...readLocaleFile(resource, "en"),
			...lang === "en" ? {} : readLocaleFile(resource, lang)
		};
		for (const key of Object.keys(texts)) texts[key] = (texts[key] ?? "").replace(/\$\{([A-Z0-9_]+)\}/g, (match, ref) => texts[ref] ?? match);
		return texts;
	}

// resource/common/locale.ts
/** This resource's lang texts: `Locale("NOTIFY_NO_MONEY", price)`; keys typed from locales/en.json. */
	const Locale = createLocale();

// resource/common/resource.ts
	const ResourceName = GetCurrentResourceName();
	const ResourceContext = IsDuplicityVersion() ? "server" : "client";

// resource/common/board.ts
/** ai-scoreboard's contracts and panel content. No natives. */
	const EVENTS = { 
	/** Callback: () -> Board, what the scoreboard shows right now (asked when the key is pressed). */
board: "ai-scoreboard:board" };

// resource/client/index.ts
	const texts = loadLocaleTexts();
	const send = (m) => SendNUIMessage(m);
	function toBoard(v) {
		const b = record(v);
		if (typeof b.online !== "number" || typeof b.max !== "number" || !Array.isArray(b.jobs) || !Array.isArray(b.players)) return null;
		return {
			online: b.online,
			max: b.max,
			jobs: b.jobs.flatMap((j) => {
				const r = record(j);
				return typeof r.label === "string" && typeof r.count === "number" ? [{
					label: r.label,
					count: r.count
				}] : [];
			}),
			players: b.players.flatMap((p) => {
				const r = record(p);
				return typeof r.id === "number" && typeof r.name === "string" ? [{
					id: r.id,
					name: r.name
				}] : [];
			})
		};
	}
	/** Held key: asks the server once per press and shows the board until the key is released. No focus. */
	let held = false;
	new Keybind({
		name: "scoreboard_open_HOME",
		description: Locale("KEYBIND_OPEN"),
		defaultKey: "HOME",
		onPressed: () => {
			held = true;
			triggerServerCallback(EVENTS.board).then((raw) => {
				const board = toBoard(raw);
				if (board && held) send({
					action: "open",
					data: {
						texts,
						board
					}
				});
			}).catch(() => void 0);
		},
		onReleased: () => {
			held = false;
			send({
				action: "close",
				data: null
			});
		}
	});

})();
}catch(e){globalThis.__aicoreReportError&&globalThis.__aicoreReportError("load: "+(e&&e.stack||e));throw e}

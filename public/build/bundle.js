
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Info.svelte generated by Svelte v3.29.0 */

    const file = "src\\Info.svelte";

    function create_fragment(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let ul;
    	let li0;
    	let t9;
    	let li1;
    	let t11;
    	let li2;
    	let t13;
    	let li3;
    	let t15;
    	let li4;
    	let t17;
    	let li5;
    	let t19;
    	let li6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Svelte provides a different approach to building web apps than some of the other frameworks covered in this module. While frameworks like React and Vue do the bulk of their work in the user's browser while the app is running, Svelte shifts that work into a compile step that happens only when you build your app, producing highly-optimized vanilla JavaScript.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "The outcome of this approach is not only smaller application bundles and better performance, but also a developer experience that is more approachable for people that have limited experience of the modern tooling ecosystem.";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Svelte sticks closely to the classic web development model of HTML, CSS, and JS, just adding a few extensions to HTML and JavaScript. It arguably has fewer concepts and tools to learn than some of the other framework options.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "W skrócie:";
    			t7 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Svelte jest kompilatorem, który kompiluje kod do czystego html, css i prawie czystego JS";
    			t9 = space();
    			li1 = element("li");
    			li1.textContent = "Svelte nie operuje na virtual DOM (który jest dodatkiem do real DOM) tylko na samym real DOM, co znacznie zwiększa prędkość i reaktywność";
    			t11 = space();
    			li2 = element("li");
    			li2.textContent = "Dzięki temu, że Svelte jest tak zbliżony do Vaniliowego JS'a, to jego programy zajmują mało miejsca, więc sa bardzo szybkie, strony są mało obciążone i zmiana parametru na stronie nie wymaga takiego nakładu pracy jak w innych frameworkach";
    			t13 = space();
    			li3 = element("li");
    			li3.textContent = "W Svelte można pisać małe jak i duże aplikacje";
    			t15 = space();
    			li4 = element("li");
    			li4.textContent = "Svelte jest idealny do Single Page Applications";
    			t17 = space();
    			li5 = element("li");
    			li5.textContent = "Każdy plik reprezentuje jeden komponent w Svelte Js + HTMl + CSS. Style z komponentów nie wpływają na siebie";
    			t19 = space();
    			li6 = element("li");
    			li6.textContent = "Oczywiście że powyższy przykład aplikacji TODO działa jak każdy inny, ale on działa bez renderowania, tzn nigdzie w godzie nie mówię aplikacji \"ej, coś się zmieniło, przerenderuj się\" tylko zmieniam tą wartość i Svelte samo wie które części strony należy zmienić - bez porównywania z poprzednim stanem strony.";
    			add_location(p0, file, 1, 4, 10);
    			add_location(p1, file, 4, 4, 395);
    			add_location(p2, file, 7, 4, 644);
    			add_location(p3, file, 10, 4, 895);
    			attr_dev(li0, "class", "svelte-1sall19");
    			add_location(li0, file, 14, 12, 952);
    			attr_dev(li1, "class", "svelte-1sall19");
    			add_location(li1, file, 15, 12, 1062);
    			attr_dev(li2, "class", "svelte-1sall19");
    			add_location(li2, file, 16, 12, 1221);
    			attr_dev(li3, "class", "svelte-1sall19");
    			add_location(li3, file, 17, 12, 1481);
    			attr_dev(li4, "class", "svelte-1sall19");
    			add_location(li4, file, 18, 12, 1549);
    			attr_dev(li5, "class", "svelte-1sall19");
    			add_location(li5, file, 19, 12, 1618);
    			attr_dev(li6, "class", "svelte-1sall19");
    			add_location(li6, file, 20, 12, 1748);
    			add_location(ul, file, 13, 8, 935);
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(div, t3);
    			append_dev(div, p2);
    			append_dev(div, t5);
    			append_dev(div, p3);
    			append_dev(div, t7);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t9);
    			append_dev(ul, li1);
    			append_dev(ul, t11);
    			append_dev(ul, li2);
    			append_dev(ul, t13);
    			append_dev(ul, li3);
    			append_dev(ul, t15);
    			append_dev(ul, li4);
    			append_dev(ul, t17);
    			append_dev(ul, li5);
    			append_dev(ul, t19);
    			append_dev(ul, li6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Info", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\TodoItem.svelte generated by Svelte v3.29.0 */
    const file$1 = "src\\TodoItem.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let div1_transition;
    	let t2;
    	let div2;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "×";
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 17, 8, 487);
    			attr_dev(div0, "class", "todo-item-label svelte-1x01ov");
    			toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			add_location(div0, file$1, 18, 8, 571);
    			attr_dev(div1, "class", "todo-item-left svelte-1x01ov");
    			add_location(div1, file$1, 16, 4, 406);
    			attr_dev(div2, "class", "remove-item svelte-1x01ov");
    			add_location(div2, file$1, 20, 4, 657);
    			attr_dev(div3, "class", "todo-item svelte-1x01ov");
    			add_location(div3, file$1, 15, 0, 378);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			input.checked = /*completed*/ ctx[0];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[5]),
    					listen_dev(input, "change", /*toggleComplete*/ ctx[3], false, false, false),
    					listen_dev(div2, "click", /*deleteTodo*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completed*/ 1) {
    				input.checked = /*completed*/ ctx[0];
    			}

    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

    			if (dirty & /*completed*/ 1) {
    				toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 20, duration: 300 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 20, duration: 300 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoItem", slots, []);
    	let { id } = $$props;
    	let { title } = $$props;
    	let { completed } = $$props;
    	const dispatch = createEventDispatcher();

    	function deleteTodo() {
    		dispatch("deleteTodo", { id });
    	}

    	function toggleComplete() {
    		dispatch("toggleComplete", { id });
    	}

    	const writable_props = ["id", "title", "completed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		completed = this.checked;
    		$$invalidate(0, completed);
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("completed" in $$props) $$invalidate(0, completed = $$props.completed);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fly,
    		id,
    		title,
    		completed,
    		dispatch,
    		deleteTodo,
    		toggleComplete
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("completed" in $$props) $$invalidate(0, completed = $$props.completed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [completed, title, deleteTodo, toggleComplete, id, input_change_handler];
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { id: 4, title: 1, completed: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoItem",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'title'");
    		}

    		if (/*completed*/ ctx[0] === undefined && !("completed" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'completed'");
    		}
    	}

    	get id() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get completed() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set completed(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Todos.svelte generated by Svelte v3.29.0 */
    const file$2 = "src\\Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (62:4) {#each filteredTodos as todo}
    function create_each_block(ctx) {
    	let div;
    	let todoitem;
    	let current;
    	const todoitem_spread_levels = [/*todo*/ ctx[16]];
    	let todoitem_props = {};

    	for (let i = 0; i < todoitem_spread_levels.length; i += 1) {
    		todoitem_props = assign(todoitem_props, todoitem_spread_levels[i]);
    	}

    	todoitem = new TodoItem({ props: todoitem_props, $$inline: true });
    	todoitem.$on("deleteTodo", /*handleDeleteTodo*/ ctx[8]);
    	todoitem.$on("toggleComplete", /*handleToggleComplete*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(todoitem.$$.fragment);
    			attr_dev(div, "class", "todo-item");
    			add_location(div, file$2, 62, 8, 1998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(todoitem, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitem_changes = (dirty & /*filteredTodos*/ 8)
    			? get_spread_update(todoitem_spread_levels, [get_spread_object(/*todo*/ ctx[16])])
    			: {};

    			todoitem.$set(todoitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(todoitem);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(62:4) {#each filteredTodos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div6;
    	let h2;
    	let t1;
    	let input0;
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let label;
    	let input1;
    	let t4;
    	let t5;
    	let div1;
    	let t6;
    	let t7;
    	let t8;
    	let div5;
    	let div3;
    	let button0;
    	let t10;
    	let button1;
    	let t12;
    	let button2;
    	let t14;
    	let div4;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredTodos*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Svelte Todo App";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			input1 = element("input");
    			t4 = text("Check All");
    			t5 = space();
    			div1 = element("div");
    			t6 = text(/*todosRemaining*/ ctx[2]);
    			t7 = text(" items left");
    			t8 = space();
    			div5 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "All";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Active";
    			t12 = space();
    			button2 = element("button");
    			button2.textContent = "Completed";
    			t14 = space();
    			div4 = element("div");
    			button3 = element("button");
    			button3.textContent = "Clear Completed";
    			add_location(h2, file$2, 59, 4, 1806);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "todo-input svelte-1brtgnb");
    			attr_dev(input0, "placeholder", "Insert todo item ...");
    			add_location(input0, file$2, 60, 4, 1835);
    			attr_dev(input1, "class", "inner-container-input svelte-1brtgnb");
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$2, 67, 20, 2212);
    			add_location(label, file$2, 67, 13, 2205);
    			add_location(div0, file$2, 67, 8, 2200);
    			add_location(div1, file$2, 68, 8, 2325);
    			attr_dev(div2, "class", "inner-container svelte-1brtgnb");
    			add_location(div2, file$2, 66, 4, 2162);
    			attr_dev(button0, "class", "svelte-1brtgnb");
    			toggle_class(button0, "active", /*currentFilter*/ ctx[1] === "all");
    			add_location(button0, file$2, 72, 12, 2435);
    			attr_dev(button1, "class", "svelte-1brtgnb");
    			toggle_class(button1, "active", /*currentFilter*/ ctx[1] === "active");
    			add_location(button1, file$2, 73, 12, 2548);
    			attr_dev(button2, "class", "svelte-1brtgnb");
    			toggle_class(button2, "active", /*currentFilter*/ ctx[1] === "completed");
    			add_location(button2, file$2, 74, 12, 2670);
    			add_location(div3, file$2, 71, 8, 2417);
    			attr_dev(button3, "class", "svelte-1brtgnb");
    			add_location(button3, file$2, 77, 12, 2830);
    			add_location(div4, file$2, 76, 8, 2812);
    			attr_dev(div5, "class", "inner-container svelte-1brtgnb");
    			add_location(div5, file$2, 70, 4, 2379);
    			attr_dev(div6, "class", "container svelte-1brtgnb");
    			add_location(div6, file$2, 58, 0, 1778);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h2);
    			append_dev(div6, t1);
    			append_dev(div6, input0);
    			set_input_value(input0, /*newTodoTitle*/ ctx[0]);
    			append_dev(div6, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(label, input1);
    			append_dev(label, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t10);
    			append_dev(div3, button1);
    			append_dev(div3, t12);
    			append_dev(div3, button2);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input0, "keydown", /*addTodo*/ ctx[4], false, false, false),
    					listen_dev(input1, "change", /*checkAllTodos*/ ctx[5], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*clearCompleted*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodoTitle*/ 1 && input0.value !== /*newTodoTitle*/ ctx[0]) {
    				set_input_value(input0, /*newTodoTitle*/ ctx[0]);
    			}

    			if (dirty & /*filteredTodos, handleDeleteTodo, handleToggleComplete*/ 776) {
    				each_value = /*filteredTodos*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div6, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*todosRemaining*/ 4) set_data_dev(t6, /*todosRemaining*/ ctx[2]);

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button0, "active", /*currentFilter*/ ctx[1] === "all");
    			}

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button1, "active", /*currentFilter*/ ctx[1] === "active");
    			}

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button2, "active", /*currentFilter*/ ctx[1] === "completed");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Todos", slots, []);
    	let newTodoTitle = "";
    	let currentFilter = "all";

    	let todos = [
    		{
    			id: 1,
    			title: "My first todo",
    			completed: false
    		},
    		{
    			id: 2,
    			title: "My second todo",
    			completed: false
    		},
    		{
    			id: 3,
    			title: "My third todo",
    			completed: false
    		}
    	];

    	let nextId = todos.length + 1;

    	function addTodo(event) {
    		if (event.key === "Enter") {
    			$$invalidate(14, todos = [
    				...todos,
    				{
    					id: nextId,
    					completed: false,
    					title: newTodoTitle
    				}
    			]);

    			nextId++;
    			$$invalidate(0, newTodoTitle = "");
    		}
    	}

    	function checkAllTodos(event) {
    		todos.forEach(todo => todo.completed = event.target.checked);
    		$$invalidate(14, todos);
    	}

    	function updateFilter(newFilter) {
    		$$invalidate(1, currentFilter = newFilter);
    	}

    	function clearCompleted() {
    		$$invalidate(14, todos = todos.filter(todo => !todo.completed));
    	}

    	function handleDeleteTodo(event) {
    		$$invalidate(14, todos = todos.filter(todo => todo.id !== event.detail.id));
    	}

    	function handleToggleComplete(event) {
    		const todoIndex = todos.findIndex(todo => todo.id === event.detail.id);

    		const updatedTodo = {
    			...todos[todoIndex],
    			completed: !todos[todoIndex].completed
    		};

    		$$invalidate(14, todos = [...todos.slice(0, todoIndex), updatedTodo, ...todos.slice(todoIndex + 1)]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		newTodoTitle = this.value;
    		$$invalidate(0, newTodoTitle);
    	}

    	const click_handler = () => updateFilter("all");
    	const click_handler_1 = () => updateFilter("active");
    	const click_handler_2 = () => updateFilter("completed");

    	$$self.$capture_state = () => ({
    		TodoItem,
    		newTodoTitle,
    		currentFilter,
    		todos,
    		nextId,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		todosRemaining,
    		filteredTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("newTodoTitle" in $$props) $$invalidate(0, newTodoTitle = $$props.newTodoTitle);
    		if ("currentFilter" in $$props) $$invalidate(1, currentFilter = $$props.currentFilter);
    		if ("todos" in $$props) $$invalidate(14, todos = $$props.todos);
    		if ("nextId" in $$props) nextId = $$props.nextId;
    		if ("todosRemaining" in $$props) $$invalidate(2, todosRemaining = $$props.todosRemaining);
    		if ("filteredTodos" in $$props) $$invalidate(3, filteredTodos = $$props.filteredTodos);
    	};

    	let todosRemaining;
    	let filteredTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentFilter, todos*/ 16386) {
    			 $$invalidate(3, filteredTodos = currentFilter === "all"
    			? todos
    			: currentFilter === "completed"
    				? todos.filter(todo => todo.completed)
    				: todos.filter(todo => !todo.completed));
    		}

    		if ($$self.$$.dirty & /*filteredTodos*/ 8) {
    			 $$invalidate(2, todosRemaining = filteredTodos.filter(todo => !todo.completed).length);
    		}
    	};

    	return [
    		newTodoTitle,
    		currentFilter,
    		todosRemaining,
    		filteredTodos,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		input0_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    function downloadBlobAsFile (blob, fileName) {
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";

        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    function downloadExampleData (mode) {
        const blob = new Blob([mode === 'txt' ? getExampleTxtData() : getExampleXmlData()],
            { type: `text/${mode};charset=utf-8` });
        downloadBlobAsFile(blob, `data.${mode}`);
    }
    function getValueFromIndex (index) {
        switch (index) {
            case 0: return "Producent"
            case 1: return "wielkość matrycy"
            case 2: return "rozdzielczość"
            case 3: return "typ matrycy"
            case 4: return "czy dotykowy ekran"
            case 5: return "procesor"
            case 6: return "liczba fizycznych rdzeni"
            case 7: return "taktowanie"
            case 8: return "RAM"
            case 9: return "pojemność dysku"
            case 10: return "typ dysku"
            case 11: return "karta graficzna"
            case 12: return "pamięć karty graficznej"
            case 13: return "system operacyjny"
            case 14: return "napęd optyczny"
        }
    }
    function getExampleXmlData () {
        return "<laptops>\n" +
            "    <laptop>\n" +
            "        <manufacturer>Asus</manufacturer>\n" +
            "        <screen>\n" +
            "            <size>12\"</size>\n" +
            "            <type>matte</type>\n" +
            "            <touchscreen>nie</touchscreen>\n" +
            "        </screen>\n" +
            "        <processor>\n" +
            "            <name>i7</name>\n" +
            "            <physical_cores>8</physical_cores>\n" +
            "            <clock_speed>3200</clock_speed>\n" +
            "        </processor>\n" +
            "        <ram>8GB</ram>\n" +
            "        <disc>\n" +
            "            <storage>240GB</storage>\n" +
            "            <type>SSD</type>\n" +
            "        </disc>\n" +
            "        <graphic_card>\n" +
            "            <name>intel HD Graphics 4000</name>\n" +
            "            <memory>1GB</memory>\n" +
            "        </graphic_card>\n" +
            "        <os>Windows 7 Home</os>\n" +
            "        <disc_reader>Blu-Ray</disc_reader>\n" +
            "    </laptop>\n" +
            "    <laptop>\n" +
            "        <manufacturer>Dell</manufacturer>\n" +
            "        <screen>\n" +
            "            <size>16\"</size>\n" +
            "            <type/>\n" +
            "            <touchscreen>tak</touchscreen>\n" +
            "        </screen>\n" +
            "        <processor>\n" +
            "            <name>i5</name>\n" +
            "            <physical_cores>4</physical_cores>\n" +
            "            <clock_speed/>\n" +
            "        </processor>\n" +
            "        <ram>16GB</ram>\n" +
            "        <disc>\n" +
            "            <storage>120GB</storage>\n" +
            "            <type/>\n" +
            "        </disc>\n" +
            "        <graphic_card>\n" +
            "            <name>intel HD Graphics 5000</name>\n" +
            "            <memory>2GB</memory>\n" +
            "        </graphic_card>\n" +
            "        <os>Windows Vista</os>\n" +
            "        <disc_reader>brak</disc_reader>\n" +
            "    </laptop>\n" +
            "</laptops>"
    }
    function getExampleTxtData () {
        return "Dell;12\";;matowa;nie;intel i7;4;2800;8GB;240GB;SSD;intel HD Graphics 4000;1GB;Windows 7 Home;;\n" +
          "Asus;14\";1600x900;matowa;nie;intel i5;4;;16GB;120GB;SSD;intel HD Graphics 5000;1GB;;brak;\n" +
          "Fujitsu;14\";1920x1080;blyszczaca;tak;intel i7;8;1900;24GB;500GB;HDD;intel HD Graphics 520;1GB;brak systemu;Blu-Ray;\n" +
          "Huawei;13\";;matowa;nie;intel i7;4;2400;12GB;24GB;HDD;NVIDIA GeForce GTX 1050;;;brak;\n" +
          "MSI;17\";1600x900;blyszczaca;tak;intel i7;4;3300;8GB;60GB;SSD;AMD Radeon Pro 455;1GB;Windows 7 Profesional;DVD;\n" +
          "Dell;;1280x800;matowa;nie;intel i7;4;2800;8GB;240GB;SSD;;;Windows 7 Home;brak;\n" +
          "Asus;14\";1600x900;matowa;nie;intel i5;4;2800;;120GB;SSD;intel HD Graphics 5000;1GB;Windows 10 Home;;\n" +
          "Fujitsu;15\";1920x1080;blyszczaca;tak;intel i7;8;2800;24GB;500GB;HDD;intel HD Graphics 520;;brak systemu;Blu-Ray;\n" +
          "Samsung;13\";1366x768;matowa;nie;intel i7;4;2800;12GB;24GB;HDD;NVIDIA GeForce GTX 1050;1GB;Windows 10 Home;brak;\n" +
          "Sony;16\";;blyszczaca;tak;intel i7;4;2800;8GB;;;AMD Radeon Pro 455;1GB;Windows 7 Profesional;DVD;\n" +
          "Samsung;12\";1280x800;matowa;nie;intel i7;;2120;;;;intel HD Graphics 4000;1GB;;brak;\n" +
          "Samsung;14\";1600x900;matowa;nie;intel i5;;;;;SSD;intel HD Graphics 5000;1GB;Windows 10 Home;brak;\n" +
          "Fujitsu;15\";1920x1080;blyszczaca;tak;intel i7;8;2800;24GB;500GB;HDD;intel HD Graphics 520;;brak systemu;Blu-Ray;\n" +
          "Huawei;13\";1366x768;matowa;nie;intel i7;4;3000;;24GB;HDD;NVIDIA GeForce GTX 1050;;Windows 10 Home;brak;\n" +
          "MSI;17\";1600x900;blyszczaca;tak;intel i7;4;9999;8GB;60GB;SSD;AMD Radeon Pro 455;1GB;Windows 7 Profesional;;"
    }

    /* src\ReadFile.svelte generated by Svelte v3.29.0 */
    const file$3 = "src\\ReadFile.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let input0;
    	let t1;
    	let input1;
    	let br;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Wczytaj dane z txt:\r\n    ");
    			input0 = element("input");
    			t1 = text("\r\n    Wczytaj dane z xml:\r\n    ");
    			input1 = element("input");
    			br = element("br");
    			t2 = text("\r\n    Pobierz idealnie przykładowe dane do tabeli (.txt):\r\n    ");
    			button0 = element("button");
    			button0.textContent = "Pobierz data.txt";
    			t4 = text("\r\n    Pobierz idealnie przykładowe dane do tabeli (.xml):\r\n    ");
    			button1 = element("button");
    			button1.textContent = "Pobierz data.xml";
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "txt");
    			attr_dev(input0, "name", "file");
    			attr_dev(input0, "accept", ".txt");
    			add_location(input0, file$3, 25, 4, 825);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "id", "xml");
    			attr_dev(input1, "name", "file");
    			attr_dev(input1, "accept", ".xml");
    			add_location(input1, file$3, 27, 4, 911);
    			add_location(br, file$3, 27, 59, 966);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$3, 29, 4, 1034);
    			attr_dev(button1, "type", "button");
    			add_location(button1, file$3, 31, 4, 1188);
    			add_location(div, file$3, 23, 0, 789);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, input0);
    			append_dev(div, t1);
    			append_dev(div, input1);
    			append_dev(div, br);
    			append_dev(div, t2);
    			append_dev(div, button0);
    			append_dev(div, t4);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ReadFile", slots, []);
    	let { data } = $$props;
    	let { typeOfData } = $$props;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		document.getElementById("txt").addEventListener("change", readFile, false);
    		document.getElementById("xml").addEventListener("change", readFile, false);

    		function readFile(evt) {
    			var files = evt.target.files;
    			var file = files[0];
    			var reader = new FileReader();

    			reader.onload = event => {
    				$$invalidate(0, data = event.target.result);
    				$$invalidate(1, typeOfData = evt.target.id);
    			};

    			reader.readAsText(file);
    		}
    	});

    	const writable_props = ["data", "typeOfData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ReadFile> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => downloadExampleData("txt");
    	const click_handler_1 = () => downloadExampleData("xml");

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("typeOfData" in $$props) $$invalidate(1, typeOfData = $$props.typeOfData);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		createEventDispatcher,
    		onMount,
    		downloadExampleData,
    		data,
    		typeOfData,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("typeOfData" in $$props) $$invalidate(1, typeOfData = $$props.typeOfData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, typeOfData, click_handler, click_handler_1];
    }

    class ReadFile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, typeOfData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ReadFile",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<ReadFile> was created without expected prop 'data'");
    		}

    		if (/*typeOfData*/ ctx[1] === undefined && !("typeOfData" in props)) {
    			console.warn("<ReadFile> was created without expected prop 'typeOfData'");
    		}
    	}

    	get data() {
    		throw new Error("<ReadFile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ReadFile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get typeOfData() {
    		throw new Error("<ReadFile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set typeOfData(value) {
    		throw new Error("<ReadFile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DataTable.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$4 = "src\\DataTable.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i][0];
    	child_ctx[18] = list[i][1];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i].flat;
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (102:20) {#each Object.entries(flat) as [key, value], i}
    function create_each_block_1(ctx) {
    	let th;
    	let input;
    	let input_value_value;
    	let input_key_value;
    	let input_flat_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			th = element("th");
    			input = element("input");
    			input.value = input_value_value = /*value*/ ctx[18];
    			attr_dev(input, "key", input_key_value = /*key*/ ctx[17]);
    			attr_dev(input, "flat", input_flat_value = /*i*/ ctx[16]);
    			attr_dev(input, "class", "cell svelte-uz88tk");
    			add_location(input, file$4, 102, 41, 4693);
    			attr_dev(th, "class", "flex svelte-uz88tk");
    			add_location(th, file$4, 102, 24, 4676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*change_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*computers*/ 1 && input_value_value !== (input_value_value = /*value*/ ctx[18]) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*computers*/ 1 && input_key_value !== (input_key_value = /*key*/ ctx[17])) {
    				attr_dev(input, "key", input_key_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(102:20) {#each Object.entries(flat) as [key, value], i}",
    		ctx
    	});

    	return block;
    }

    // (100:16) {#each computers as { flat }
    function create_each_block$1(ctx) {
    	let tr;
    	let t;
    	let tr_computer_value;
    	let each_value_1 = Object.entries(/*flat*/ ctx[14]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "flex svelte-uz88tk");
    			attr_dev(tr, "computer", tr_computer_value = /*i*/ ctx[16]);
    			add_location(tr, file$4, 100, 16, 4549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, computers, inputChanged*/ 5) {
    				each_value_1 = Object.entries(/*flat*/ ctx[14]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(100:16) {#each computers as { flat }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let div1;
    	let div0;
    	let table;
    	let tr;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let th5;
    	let t16;
    	let th6;
    	let t18;
    	let th7;
    	let t20;
    	let th8;
    	let t22;
    	let th9;
    	let t24;
    	let th10;
    	let t26;
    	let th11;
    	let t28;
    	let th12;
    	let t30;
    	let th13;
    	let t32;
    	let th14;
    	let t34;
    	let mounted;
    	let dispose;
    	let each_value = /*computers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			t0 = text("Zapisz dane do txt:\r\n    ");
    			button0 = element("button");
    			button0.textContent = "Zapisz do pliku txt";
    			t2 = text("\r\n    Zapisz dane do xml:\r\n    ");
    			button1 = element("button");
    			button1.textContent = "Zapisz do pliku xml";
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Producent";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "wielkość matrycy";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "rozdzielczość";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "typ matrycy";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "czy dotykowy ekran";
    			t14 = space();
    			th5 = element("th");
    			th5.textContent = "procesor";
    			t16 = space();
    			th6 = element("th");
    			th6.textContent = "liczba fizycznych rdzeni";
    			t18 = space();
    			th7 = element("th");
    			th7.textContent = "taktowanie";
    			t20 = space();
    			th8 = element("th");
    			th8.textContent = "RAM";
    			t22 = space();
    			th9 = element("th");
    			th9.textContent = "pojemność dysku";
    			t24 = space();
    			th10 = element("th");
    			th10.textContent = "typ dysku";
    			t26 = space();
    			th11 = element("th");
    			th11.textContent = "karta graficzna";
    			t28 = space();
    			th12 = element("th");
    			th12.textContent = "pamięć karty graficznej";
    			t30 = space();
    			th13 = element("th");
    			th13.textContent = "system operacyjny";
    			t32 = space();
    			th14 = element("th");
    			th14.textContent = "napęd optyczny";
    			t34 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "id", "to-txt-save");
    			add_location(button0, file$4, 76, 4, 3153);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "id", "to-xml-save");
    			add_location(button1, file$4, 78, 4, 3284);
    			attr_dev(th0, "class", "table-head svelte-uz88tk");
    			add_location(th0, file$4, 83, 20, 3525);
    			attr_dev(th1, "class", "table-head svelte-uz88tk");
    			add_location(th1, file$4, 84, 20, 3584);
    			attr_dev(th2, "class", "table-head svelte-uz88tk");
    			add_location(th2, file$4, 85, 20, 3650);
    			attr_dev(th3, "class", "table-head svelte-uz88tk");
    			add_location(th3, file$4, 86, 20, 3713);
    			attr_dev(th4, "class", "table-head svelte-uz88tk");
    			add_location(th4, file$4, 87, 20, 3774);
    			attr_dev(th5, "class", "table-head svelte-uz88tk");
    			add_location(th5, file$4, 88, 20, 3842);
    			attr_dev(th6, "class", "table-head svelte-uz88tk");
    			add_location(th6, file$4, 89, 20, 3900);
    			attr_dev(th7, "class", "table-head svelte-uz88tk");
    			add_location(th7, file$4, 90, 20, 3974);
    			attr_dev(th8, "class", "table-head svelte-uz88tk");
    			add_location(th8, file$4, 91, 20, 4034);
    			attr_dev(th9, "class", "table-head svelte-uz88tk");
    			add_location(th9, file$4, 92, 20, 4087);
    			attr_dev(th10, "class", "table-head svelte-uz88tk");
    			add_location(th10, file$4, 93, 20, 4152);
    			attr_dev(th11, "class", "table-head svelte-uz88tk");
    			add_location(th11, file$4, 94, 20, 4211);
    			attr_dev(th12, "class", "table-head svelte-uz88tk");
    			add_location(th12, file$4, 95, 20, 4276);
    			attr_dev(th13, "class", "table-head svelte-uz88tk");
    			add_location(th13, file$4, 96, 20, 4349);
    			attr_dev(th14, "class", "table-head svelte-uz88tk");
    			add_location(th14, file$4, 97, 20, 4416);
    			attr_dev(tr, "class", "flex svelte-uz88tk");
    			add_location(tr, file$4, 82, 16, 3486);
    			attr_dev(table, "class", "svelte-uz88tk");
    			add_location(table, file$4, 81, 12, 3461);
    			attr_dev(div0, "id", "table-scroll");
    			attr_dev(div0, "class", "svelte-uz88tk");
    			add_location(div0, file$4, 80, 8, 3424);
    			attr_dev(div1, "id", "table-wrapper");
    			attr_dev(div1, "class", "svelte-uz88tk");
    			add_location(div1, file$4, 79, 4, 3390);
    			add_location(div2, file$4, 74, 0, 3117);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t0);
    			append_dev(div2, button0);
    			append_dev(div2, t2);
    			append_dev(div2, button1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(tr, t12);
    			append_dev(tr, th4);
    			append_dev(tr, t14);
    			append_dev(tr, th5);
    			append_dev(tr, t16);
    			append_dev(tr, th6);
    			append_dev(tr, t18);
    			append_dev(tr, th7);
    			append_dev(tr, t20);
    			append_dev(tr, th8);
    			append_dev(tr, t22);
    			append_dev(tr, th9);
    			append_dev(tr, t24);
    			append_dev(tr, th10);
    			append_dev(tr, t26);
    			append_dev(tr, th11);
    			append_dev(tr, t28);
    			append_dev(tr, th12);
    			append_dev(tr, t30);
    			append_dev(tr, th13);
    			append_dev(tr, t32);
    			append_dev(tr, th14);
    			append_dev(table, t34);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, computers, inputChanged*/ 5) {
    				each_value = /*computers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DataTable", slots, []);
    	let { data } = $$props;
    	let { typeOfData } = $$props;
    	let txtData = "";
    	let xmlData = "";
    	let computers = [];

    	onMount(() => {
    		console.log(typeOfData);
    		createComputersObject();
    	});

    	function saveFile(mode) {
    		const blob = new Blob([mode === "txt" ? txtData : xmlData], { type: `text/${mode};charset=utf-8` });
    		downloadBlobAsFile(blob, `data.${mode}`);
    	}

    	function inputChanged(e) {
    		$$invalidate(0, computers[e.path[2].attributes[1].value].flat[e.target.attributes[0].value] = e.target.value, computers);
    		setTxtDataFromComputers();
    	}

    	function setTxtDataFromComputers() {
    		if (computers.length === 0) return "";
    		let localData = "";

    		computers.forEach((computer, computersIndex) => {
    			Object.entries(computer.flat).forEach((entry, index) => {
    				localData += `${entry[1]};`;

    				if (computersIndex !== computers.length - 1 && index === 14) {
    					localData += `\n`;
    				}
    			});
    		});

    		$$invalidate(3, data = txtData = localData);
    		createComputersObject();
    	}

    	function createComputersObject() {
    		typeOfData === "txt"
    		? createComputersFromTxt()
    		: createComputersFromXml();
    	}

    	function createComputersFromTxt() {
    		$$invalidate(0, computers = []);

    		data.split("\n").forEach(computer => {
    			let object = {
    				matryca: {},
    				procesor: {},
    				dysk: {},
    				"karta graficzna": {},
    				flat: {}
    			};

    			computer.split(";").forEach((parameter, index) => {
    				index < 15
    				? object.flat[getValueFromIndex(index)] = parameter
    				: "";

    				if (index === 0) {
    					object[getValueFromIndex(index)] = parameter;
    				} else if (index > 0 && index < 5) {
    					//matryca
    					object.matryca[getValueFromIndex(index)] = parameter;
    				} else if (index > 4 && index < 8) {
    					//procesor
    					object.procesor[getValueFromIndex(index)] = parameter;
    				} else if (index === 8) {
    					//RAM
    					object[getValueFromIndex(index)] = parameter;
    				} else if (index > 8 && index < 11) {
    					//dysk
    					object.dysk[getValueFromIndex(index)] = parameter;
    				} else if (index > 10 && index < 13) {
    					// karta
    					object["karta graficzna"][getValueFromIndex(index)] = parameter;
    				} else if (index === 13) {
    					object[getValueFromIndex(index)] = parameter;
    				} else if (index === 14) {
    					object[getValueFromIndex(index)] = parameter;
    				}
    			});

    			$$invalidate(0, computers = [...computers, object]);
    		});
    	}

    	function createComputersFromXml() {
    		$$invalidate(0, computers = []);
    	} // const cos = convert.xml2json(xmlData, {compact: true, spaces: 4})
    	// console.log(cos)

    	const writable_props = ["data", "typeOfData"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<DataTable> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => saveFile("txt");
    	const click_handler_1 = () => saveFile("xml");
    	const change_handler = e => inputChanged(e);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("typeOfData" in $$props) $$invalidate(4, typeOfData = $$props.typeOfData);
    	};

    	$$self.$capture_state = () => ({
    		downloadBlobAsFile,
    		getValueFromIndex,
    		onMount,
    		afterUpdate,
    		beforeUpdate,
    		data,
    		typeOfData,
    		txtData,
    		xmlData,
    		computers,
    		saveFile,
    		inputChanged,
    		setTxtDataFromComputers,
    		createComputersObject,
    		createComputersFromTxt,
    		createComputersFromXml
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("typeOfData" in $$props) $$invalidate(4, typeOfData = $$props.typeOfData);
    		if ("txtData" in $$props) txtData = $$props.txtData;
    		if ("xmlData" in $$props) xmlData = $$props.xmlData;
    		if ("computers" in $$props) $$invalidate(0, computers = $$props.computers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		computers,
    		saveFile,
    		inputChanged,
    		data,
    		typeOfData,
    		click_handler,
    		click_handler_1,
    		change_handler
    	];
    }

    class DataTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 3, typeOfData: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataTable",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[3] === undefined && !("data" in props)) {
    			console_1.warn("<DataTable> was created without expected prop 'data'");
    		}

    		if (/*typeOfData*/ ctx[4] === undefined && !("typeOfData" in props)) {
    			console_1.warn("<DataTable> was created without expected prop 'typeOfData'");
    		}
    	}

    	get data() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get typeOfData() {
    		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set typeOfData(value) {
    		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.0 */
    const file$5 = "src\\App.svelte";

    // (14:1) {#if data && data !== ''}
    function create_if_block(ctx) {
    	let datatable;
    	let updating_data;
    	let current;

    	function datatable_data_binding(value) {
    		/*datatable_data_binding*/ ctx[5].call(null, value);
    	}

    	let datatable_props = { typeOfData: /*typeOfData*/ ctx[2] };

    	if (/*data*/ ctx[1] !== void 0) {
    		datatable_props.data = /*data*/ ctx[1];
    	}

    	datatable = new DataTable({ props: datatable_props, $$inline: true });
    	binding_callbacks.push(() => bind(datatable, "data", datatable_data_binding));

    	const block = {
    		c: function create() {
    			create_component(datatable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datatable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datatable_changes = {};
    			if (dirty & /*typeOfData*/ 4) datatable_changes.typeOfData = /*typeOfData*/ ctx[2];

    			if (!updating_data && dirty & /*data*/ 2) {
    				updating_data = true;
    				datatable_changes.data = /*data*/ ctx[1];
    				add_flush_callback(() => updating_data = false);
    			}

    			datatable.$set(datatable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datatable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datatable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datatable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(14:1) {#if data && data !== ''}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let readfile;
    	let updating_data;
    	let updating_typeOfData;
    	let t4;
    	let t5;
    	let todos;
    	let t6;
    	let info;
    	let current;

    	function readfile_data_binding(value) {
    		/*readfile_data_binding*/ ctx[3].call(null, value);
    	}

    	function readfile_typeOfData_binding(value) {
    		/*readfile_typeOfData_binding*/ ctx[4].call(null, value);
    	}

    	let readfile_props = {};

    	if (/*data*/ ctx[1] !== void 0) {
    		readfile_props.data = /*data*/ ctx[1];
    	}

    	if (/*typeOfData*/ ctx[2] !== void 0) {
    		readfile_props.typeOfData = /*typeOfData*/ ctx[2];
    	}

    	readfile = new ReadFile({ props: readfile_props, $$inline: true });
    	binding_callbacks.push(() => bind(readfile, "data", readfile_data_binding));
    	binding_callbacks.push(() => bind(readfile, "typeOfData", readfile_typeOfData_binding));
    	let if_block = /*data*/ ctx[1] && /*data*/ ctx[1] !== "" && create_if_block(ctx);
    	todos = new Todos({ $$inline: true });
    	info = new Info({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			t3 = space();
    			create_component(readfile.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(todos.$$.fragment);
    			t6 = space();
    			create_component(info.$$.fragment);
    			attr_dev(h1, "class", "svelte-z29l87");
    			add_location(h1, file$5, 11, 1, 237);
    			attr_dev(main, "class", "svelte-z29l87");
    			add_location(main, file$5, 10, 0, 229);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(main, t3);
    			mount_component(readfile, main, null);
    			append_dev(main, t4);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t5);
    			mount_component(todos, main, null);
    			append_dev(main, t6);
    			mount_component(info, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			const readfile_changes = {};

    			if (!updating_data && dirty & /*data*/ 2) {
    				updating_data = true;
    				readfile_changes.data = /*data*/ ctx[1];
    				add_flush_callback(() => updating_data = false);
    			}

    			if (!updating_typeOfData && dirty & /*typeOfData*/ 4) {
    				updating_typeOfData = true;
    				readfile_changes.typeOfData = /*typeOfData*/ ctx[2];
    				add_flush_callback(() => updating_typeOfData = false);
    			}

    			readfile.$set(readfile_changes);

    			if (/*data*/ ctx[1] && /*data*/ ctx[1] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*data*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t5);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(readfile.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(todos.$$.fragment, local);
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(readfile.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(todos.$$.fragment, local);
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(readfile);
    			if (if_block) if_block.d();
    			destroy_component(todos);
    			destroy_component(info);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	let data = "";
    	let typeOfData = "";
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function readfile_data_binding(value) {
    		data = value;
    		$$invalidate(1, data);
    	}

    	function readfile_typeOfData_binding(value) {
    		typeOfData = value;
    		$$invalidate(2, typeOfData);
    	}

    	function datatable_data_binding(value) {
    		data = value;
    		$$invalidate(1, data);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Info,
    		Todos,
    		ReadFile,
    		DataTable,
    		name,
    		data,
    		typeOfData
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("typeOfData" in $$props) $$invalidate(2, typeOfData = $$props.typeOfData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		data,
    		typeOfData,
    		readfile_data_binding,
    		readfile_typeOfData_binding,
    		datatable_data_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

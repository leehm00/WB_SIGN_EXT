// ==UserScript==
// @name       微博超话自动签到
// @description  用户登录后进入微博主页，获取超级话题并自动签到
// @homepageURL  https://github.com/Deuscx/WB_SIGN_EXT
// @supportURL   https://github.com/Deuscx/WB_SIGN_EXT/issues
// @grant       none
// @version     2.0.3
// @author       deus
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @require     https://cdn.jsdelivr.net/combine/npm/@violentmonkey/dom@1,npm/@violentmonkey/ui@0.4
// @require    https://cdn.jsdelivr.net/npm/axios@0.21.0/dist/axios.min.js
// @namespace https://deuscx.github.io/
// ==/UserScript==
(function() {
    "use strict";
    var css_248z = ".configContainer{display:flex;flex-direction:column;position:fixed;--bg-opacity:1;background-color:#fff;background-color:rgba(255,255,255,var(--bg-opacity));z-index:10;border-radius:.25rem;border-width:1px;--border-opacity:1;border-color:#cbd5e0;border-color:rgba(203,213,224,var(--border-opacity));padding:.75rem .5rem;max-width:190px;bottom:80px;right:0;transform:translateX(100%);transition-duration:.5s;transition-timing-function:cubic-bezier(.22,1,.36,1);transition-property:transform}.configContainer .cItem{font-size:.875rem;display:flex;justify-content:space-between;cursor:pointer}.configContainer .cItem .des{--text-opacity:1;color:#718096;color:rgba(113,128,150,var(--text-opacity))}#TIMEOUT{-webkit-appearance:none;-moz-appearance:none;appearance:none;display:inline-block;width:60px}.configContainer .action{padding-top:.5rem;padding-bottom:.5rem;border-radius:.25rem;background-color:#fff;cursor:pointer;position:absolute;top:50%;left:0;transform:translate3d(-100%,-50%,0)}.configContainer .action:hover{color:#ccc}.active{transform:translateX(0)}";
    const tz_offset = (new Date).getTimezoneOffset() + 480;
    const ts_ms = Date.now;
    const isNewDay = ts => {
        if (!ts) return true;
        const t = new Date(ts);
        t.setMinutes(t.getMinutes() + tz_offset);
        t.setHours(0, 0, 0, 0);
        const d = new Date;
        d.setMinutes(t.getMinutes() + tz_offset);
        return d - t > 864e5;
    };
    const Store = function() {
        const set = function(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        };
        const get = function(key) {
            const v = localStorage.getItem(key);
            try {
                return JSON.parse(v);
            } catch (error) {
                return v;
            }
        };
        const remove = function(key) {
            localStorage.removeItem(key);
        };
        const has = function(key) {
            return Reflect.has(localStorage, key);
        };
        return {
            set: set,
            get: get,
            remove: remove,
            has: has
        };
    }();
    const getId = (i => () => i++)(0);
    const NAME = "WB";
    const SIGNED_ARR = `${NAME}_SIGNED_ARR`;
    const WB_CONFIG_CONSTANT = "WB_CONFIG";
    const TOAST_TYPE = {
        DEFAULT: "default",
        SUCCESS: "success",
        ERROR: "error",
        INFO: "info",
        WARNING: "warning"
    };
    let CONFIG = Store.get(WB_CONFIG_CONSTANT);
    function ConfigPanel() {
        const handleAutoSign = e => {
            const v = e.target.checked;
            const newConfig = Object.assign({}, CONFIG, {
                AUTO_SIGN: v
            });
            CONFIG = newConfig;
            Store.set(WB_CONFIG_CONSTANT, CONFIG);
        };
        const handleShowToast = e => {
            const v = e.target.checked;
            const newConfig = Object.assign({}, CONFIG, {
                SHOW_TOAST: v
            });
            CONFIG = newConfig;
            Store.set(WB_CONFIG_CONSTANT, CONFIG);
        };
        const handleTimeout = e => {
            const v = e.target.value;
            const newConfig = Object.assign({}, CONFIG, {
                TIMEOUT: v
            });
            CONFIG = newConfig;
            Store.set(WB_CONFIG_CONSTANT, CONFIG);
        };
        const toggleClassList = () => {
            document.querySelector(".configContainer").classList.toggle("active");
        };
        return VM.createElement(VM.Fragment, null, VM.createElement("div", {
            className: "configContainer"
        }, VM.createElement("label", {
            htmlFor: "AUTO_SIGN",
            className: "cItem"
        }, VM.createElement("span", {
            className: "des"
        }, "自动签到"), VM.createElement("input", {
            id: "AUTO_SIGN",
            type: "checkbox",
            onInput: handleAutoSign,
            checked: CONFIG.AUTO_SIGN
        })), VM.createElement("label", {
            htmlFor: "SHOW_TOAST",
            className: "cItem"
        }, VM.createElement("span", {
            className: "des"
        }, "是否展示气泡"), VM.createElement("input", {
            id: "SHOW_TOAST",
            type: "checkbox",
            onInput: handleShowToast,
            checked: CONFIG.SHOW_TOAST
        })), VM.createElement("label", {
            htmlFor: "TIMEOUT",
            className: "cItem"
        }, VM.createElement("span", {
            className: "des"
        }, "气泡展示时间"), VM.createElement("input", {
            id: "TIMEOUT",
            type: "number",
            onInput: handleTimeout,
            min: "0",
            value: parseInt(CONFIG.TIMEOUT, 10),
            placeholder: "单位为毫秒"
        })), VM.createElement("div", {
            className: "action",
            onClick: toggleClassList
        }, "收放")), VM.createElement("style", null, css_248z));
    }
    var css_248z$1 = ".msgContainer{position:fixed;background-color:initial;top:4rem;right:40px}@keyframes slide-in-right{0%{transform:translateX(1000px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slide-out-right{0%{transform:translateX(0);opacity:1}to{transform:translateX(1000px);opacity:0}}.removing{animation:slide-out-right .5s cubic-bezier(.55,.085,.68,.53) both}.toastItem{background-color:#fff;background-color:rgba(255,255,255,var(--bg-opacity));border-width:1px;--border-opacity:1;border-color:#cbd5e0;border-color:rgba(203,213,224,var(--border-opacity));border-radius:.375rem;max-width:20rem;--text-opacity:1;color:#fff;color:rgba(255,255,255,var(--text-opacity));z-index:10;padding:1rem 1.5rem;cursor:pointer;--bg-opacity:1;background-color:#3182ce;background-color:rgba(49,130,206,var(--bg-opacity));opacity:.8;margin-bottom:.5rem;animation:slide-in-right .5s cubic-bezier(.25,.46,.45,.94) both}.toast-info{--bg-opacity:1;background-color:#63b3ed;background-color:rgba(99,179,237,var(--bg-opacity))}.toast-default{--bg-opacity:1;background-color:#3182ce;background-color:rgba(49,130,206,var(--bg-opacity))}.toast-success{--bg-opacity:1;background-color:#48bb78;background-color:rgba(72,187,120,var(--bg-opacity))}.toast-error{background-color:#ff5252}.toast-warning{--bg-opacity:1;background-color:#f6e05e;background-color:rgba(246,224,94,var(--bg-opacity))}";
    const MAX_TOAST = 8;
    let totalToast = 0;
    const innerToast = props => {
        const {content: content, type: type, timeout: timeout} = props;
        function remove() {
            const current = document.querySelector(`[data-tid='${props.id}']`);
            current.classList.add("removing");
            requestAnimationFrame((() => {
                current.parentNode.removeChild(current);
                totalToast--;
            }));
        }
        timeout && setTimeout((() => {
            remove();
        }), timeout);
        return VM.createElement(VM.Fragment, null, VM.createElement("div", {
            "data-tid": props.id,
            className: `toastItem toast-${type}`,
            onClick: remove
        }, content));
    };
    const ToastContainer = () => VM.createElement("div", {
        className: "msgContainer"
    }, VM.createElement("style", null, css_248z$1));
    const defaultOptions = {
        type: TOAST_TYPE.INFO,
        timeout: 5e3
    };
    const toastFactory = () => {
        const c = ToastContainer();
        const container = document.body.appendChild(c);
        const toast = (content, options) => {
            if (!Store.get(WB_CONFIG_CONSTANT).SHOW_TOAST) return;
            const newOptions = Object.assign({}, defaultOptions, {
                id: getId()
            }, options, {
                content: content
            });
            if (totalToast < MAX_TOAST) {
                totalToast++;
                container.appendChild(innerToast(newOptions));
            }
        };
        toast.success = (content, options) => toast(content, Object.assign({}, options, {
            type: TOAST_TYPE.SUCCESS
        }));
        toast.error = (content, options) => toast(content, Object.assign({}, options, {
            type: TOAST_TYPE.ERROR
        }));
        toast.info = (content, options) => toast(content, Object.assign({}, options, {
            type: TOAST_TYPE.INFO
        }));
        toast.warn = (content, options) => toast(content, Object.assign({}, options, {
            type: TOAST_TYPE.WARNING
        }));
        return toast;
    };
    const toast = toastFactory();
    const WB_DEFAULT_CONFIG = {
        AUTO_SIGN: true,
        SHOW_TOAST: true,
        TIMEOUT: 1e3
    };
    const instance = axios.create({
        baseURL: "https://weibo.com/",
        timeout: 1e3 * 5
    });
    instance.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    instance.interceptors.request.use((config => config), (error => Promise.error(error)));
    instance.interceptors.response.use((res => 200 === res.status ? Promise.resolve(res) : Promise.reject(res)), (error => {
        const {response: response} = error;
        if (response) {
            console.log("发送请求失败", response);
            return Promise.reject(response);
        }
        if (!window.navigator.onLine) console.error("断网"); else return Promise.reject(error);
    }));
    class BaseFeature {
        constructor({name: name}) {
            this.launch = () => {};
            this.name = name;
        }
        get store() {
            const res = Store.get(this.name);
            if (res) return res;
            Store.set(this.name, void 0);
            return;
        }
        set store(v) {
            Store.set(this.name, v);
        }
        init() {
            return new Promise(((resolve, reject) => {
                try {
                    this.launch();
                    resolve(this);
                } catch (error) {
                    console.log(`run ${this.name} error`);
                    reject(error);
                }
            }));
        }
    }
    function isCheck() {
        return Store.get("isCheck") || false;
    }
    const lastCheck = Store.get("lastCheck");
    const signInterestAPI = id => instance({
        url: "p/aj/general/button",
        params: {
            ajwvr: 6,
            api: "http://i.huati.weibo.com/aj/super/checkin",
            texta: encodeURI("签到"),
            textb: encodeURI("已签到"),
            status: 0,
            id: id,
            __rnd: (new Date).getTime()
        }
    });
    let SignedArr = Store.get(SIGNED_ARR) || [];
    const signInterest = ({id: id, name: name}) => new Promise(((resolve, reject) => {
        signInterestAPI(id).then((response => {
            const {data: data} = response;
            if ("100000" === data.code) {
                window.toast.success(`[${name}签到成功]${data.msg} ---${data.data.alert_title}`);
                Store.set("lastCheck", ts_ms());
                SignedArr.push(name);
                SignedArr = Array.from(new Set(SignedArr));
                Store.set(SIGNED_ARR, SignedArr);
            } else {
                window.toast.warn(`[${name}超话签到]${data.msg}`);
                if (382004 !== data.code) reject("error"); else {
                    Store.set("lastCheck", ts_ms());
                    SignedArr.push(name);
                    SignedArr = Array.from(new Set(SignedArr));
                    Store.set(SIGNED_ARR, SignedArr);
                }
            }
            resolve();
        }), (err => {
            reject(err);
            window.toast.error(`[${name}超话签到]签到失败，请检查网络`);
        }));
    }));
    function getInterestNameAId(page = 1) {
        return new Promise(((resolve, reject) => {
            instance({
                url: `ajax/profile/topicContent?tabid=231093_-_chaohua&page=${page}`
            }).then((response => {
                const {data: {data: data, ok: ok}} = response;
                if (1 !== ok) reject({
                    err: "获取关注超话失败",
                    data: data
                });
                const list = data.list;
                const total_number = data.total_number;
                function extractId(oid) {
                    return oid.slice(5);
                }
                const simList = list.map((({oid: oid, topic_name: topic_name}) => ({
                    id: extractId(oid),
                    name: topic_name
                })));
                if (0 !== total_number) getInterestNameAId(page + 1).then((li => {
                    resolve(simList.concat(li));
                })); else resolve(simList);
            }), (err => {
                console.error(`[${NAME}]`, err);
                reject("获取hash失败");
            }));
        }));
    }
    class Interest extends BaseFeature {
        constructor() {
            super({
                name: WB_CONFIG_CONSTANT
            });
            this.launch = async () => {
                const config = super.store;
                if (!config.AUTO_SIGN) return;
                if (isCheck() && !isNewDay(lastCheck)) {
                    window.toast.info("今日已签到");
                    return;
                }
                if (isNewDay(lastCheck)) {
                    Store.remove(SIGNED_ARR);
                    Store.set("isCheck", false);
                }
                let idNameList = await getInterestNameAId();
                const signedArr = Store.get(SIGNED_ARR);
                if (signedArr && signedArr.length) idNameList = idNameList.filter((v => !signedArr.includes(v.name)));
                Promise.all(idNameList.map((({name: name, id: id}) => signInterest({
                    id: id,
                    name: name
                })))).then((() => {
                    Store.set("isCheck", true);
                }));
            };
        }
        run() {
            this.init().then((self => {}));
        }
    }
    var Interest$1 = new Interest;
    function initConfig() {
        if (!Store.get(WB_CONFIG_CONSTANT)) Store.set(WB_CONFIG_CONSTANT, WB_DEFAULT_CONFIG);
    }
    function initDOM() {
        return new Promise(((resolve, reject) => {
            try {
                const mainI = ConfigPanel();
                document.body.appendChild(mainI);
            } catch (error) {
                throw new Error("初始化DOM失败");
            }
        }));
    }
    function BaseInit() {
        initConfig();
        window.toast = toast;
    }
    function OtherInit() {
        initDOM();
    }
    function main() {
        BaseInit();
        OtherInit();
        Interest$1.run();
    }
    main();
})();

import { createRenderEffect, onCleanup, createContext, useContext, createResource } from "solid-js";

export const PerfixURI = "https://ae.helper.com/admin/";

const Cfg = createContext();
export function CfgProvider(props) {
    const [cfg] = createResource(() => fetch(PerfixURI + "get/cfg", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(["PRODUCT_URL_PATTERN", "ORDER_URL_PATTERN", "OFFER_URL_PATTERN", "LG_ORDER_URL_PATTERN", "SALE2STOCK"]),
    }).then(r => r.json()).then(r => r.data));

    return (
        <Cfg.Provider value={cfg}>
            {props.children}
        </Cfg.Provider>
    );
}
export function useCfg() { return useContext(Cfg); }

export function debouncePromise(fn, wait = 0, options = {}) {
    let lastCallAt
    let deferred
    let timer
    let pendingArgs = []
    return function debounced(...args) {
        const currentWait = getWait(wait)
        const currentTime = new Date().getTime()

        const isCold = !lastCallAt || (currentTime - lastCallAt) > currentWait

        lastCallAt = currentTime

        if (isCold && options.leading) {
            return options.accumulate
                ? Promise.resolve(fn.call(this, [args])).then(result => result[0])
                : Promise.resolve(fn.call(this, ...args))
        }

        if (deferred) {
            clearTimeout(timer)
        } else {
            deferred = defer()
        }

        pendingArgs.push(args)
        timer = setTimeout(flush.bind(this), currentWait)

        if (options.accumulate) {
            const argsIndex = pendingArgs.length - 1
            return deferred.promise.then(results => results[argsIndex])
        }

        return deferred.promise
    }

    function flush() {
        const thisDeferred = deferred
        clearTimeout(timer)

        Promise.resolve(
            options.accumulate
                ? fn.call(this, pendingArgs)
                : fn.apply(this, pendingArgs[pendingArgs.length - 1])
        )
            .then(thisDeferred.resolve, thisDeferred.reject)

        pendingArgs = []
        deferred = null
    }

    function getWait(wait) {
        return (typeof wait === 'function') ? wait() : wait
    }

    function defer() {
        const deferred = {}
        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = resolve
            deferred.reject = reject
        })
        return deferred
    }
}

export function model(el, action) {
    const [field, setField] = action();
    let handle = null;
    const itype = el.getAttribute('itype');
    let eName = "change";
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        eName = "change";
    }
    createRenderEffect(() => {
        switch (itype) {
            case "int":
                el.value = field() || null;
                break;
            case "selInt":
                el.value = field();
                break;
            case "text":
                el.value = field();
                break;
            case "switch":
                el.checked = field();
                break;
            default:
                el.value = field();
                break;
        }
    });
    switch (itype) {
        case "int":
            handle = () => {
                el.value = el.value.replace(/[^-0-9]/g, '');
                if (el.value === '') {
                    setField(0);
                    return
                }
                let intValue = parseInt(el.value, 10);
                if (isNaN(intValue)) {
                    setField(0);
                } else {
                    setField(intValue);
                }
            };
            break;
        case "selInt":
            handle = () => {
                el.value = el.value.replace(/[^-0-9]/g, '');
                if (el.value === '') {
                    setField(0);
                    return
                }
                let intValue = parseInt(el.value, 10);
                if (isNaN(intValue)) {
                    setField(0);
                } else {
                    setField(intValue);
                }
            };
            break;
        case "text":
            handle = () => setField(el.value);
            break;
        case "switch":
            handle = () => {
                setField(el.checked);
            }
            break;
        default:
            handle = () => setField(el.value);
            break;
    }
    el.addEventListener(eName, handle);
    onCleanup(() => {
        el.removeEventListener(eName, handle);
    });
}

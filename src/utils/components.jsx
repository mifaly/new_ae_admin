import { Show, createSignal, mergeProps, onCleanup } from "solid-js"
import { render, Portal } from "solid-js/web";
import { model } from "./utils"
import { MonacoEditor, MonacoDiffEditor } from 'solid-monaco';

export function NumberInput(props) {
    const input = (<input ref={props.ref} type="text" itype="int" use:model={props.model} placeholder={props.placeholder || props.name || ''} prop:name={props.name || ''} class={"input input-primary input-bordered max-w-xs" + (props.class ? " " + props.class : "")} />);
    if (props.label) {
        return (
            <label class="form-control w-auto max-w-xs input-xs inline-block">
                <div class="label py-1">
                    <span class="label-text">{props.label || props.name}</span>
                </div>
                {input}
            </label>
        );
    } else {
        return input;
    }
}

export function TextInput(props) {
    if (props.label) {
        return (
            <label class="form-control w-auto max-w-xs input-xs inline-block">
                <div class="label py-1">
                    <span class="label-text">{props.label || props.name}</span>
                </div>
                <input ref={props.ref} type="text" itype="text" use:model={props.model} placeholder={props.placeholder || props.name || ''} prop:name={props.name || ''} class={"input input-primary max-w-xs" + (props.class ? " " + props.class : "")} />
            </label>
        );
    } else {
        return (
            <input ref={props.ref} type="text" itype="text" use:model={props.model} placeholder={props.placeholder || props.name} prop:name={props.name || ''} class={"input input-primary max-w-xs" + (props.class ? " " + props.class : "")} />
        );
    }
}

export function Select(props) {
    if (props.label) {
        return (
            <label class="form-control w-auto max-w-xs inline-block pr-2">
                <div class="label py-1">
                    <span class="label-text">{props.label || props.name}</span>
                </div>
                <select ref={props.ref} itype="selInt" use:model={props.model} prop:name={props.name || ''} class={"select select-primary max-w-xs" + (props.class ? " " + props.class : "")}>
                    <For each={props.options}>
                        {option => <option value={option.value} prop:selected={props.default === option.value}>{option.label}</option>}
                    </For>
                </select>
            </label>
        );
    } else {
        return (
            <select ref={props.ref} itype="selInt" use:model={props.model} prop:name={props.name || ''} class={"select select-primary max-w-xs" + (props.class ? " " + props.class : "")}>
                <For each={props.options}>
                    {option => <option value={option.value} prop:selected={props.default === option.value}>{option.label}</option>}
                </For>
            </select>
        );
    }
}

export function Switch(props) {
    if (props.label) {
        return (
            <label class="form-control w-auto cursor-pointer inline-block">
                <div class="label py-1">
                    <span class="label-text">{props.label || props.name}</span>
                </div>
                <input ref={props.ref} type="checkbox" itype="switch" class={"toggle" + (props.class ? " " + props.class : "")} use:model={props.model} prop:name={props.name || ''} value={true} prop:checked={props.default} />
            </label>
        );
    } else {
        return (
            <input ref={props.ref} type="checkbox" itype="switch" class={"toggle" + (props.class ? " " + props.class : "")} use:model={props.model} prop:name={props.name || ''} value={true} prop:checked={props.default} />
        );
    }
}

export function TextArea(props) {
    return (
        <textarea ref={props.ref} itype="text" use:model={props.model} placeholder={props.placeholder || props.name} prop:name={props.name || ''} class={"textarea textarea-primary max-w-xs" + (props.class ? " " + props.class : "")} style="resize: none"></textarea>
    );
}

export function Alert(props) {
    let [show, setShow] = createSignal(true);
    const sets = mergeProps({ err: new Error("error occured"), hideAfter: 3000 }, props);
    if (props.hideAfter > -1) {
        let timer = setTimeout(() => {
            setShow(false);
        }, sets.hideAfter)
        onCleanup(() => clearInterval(timer));
    }
    return (
        <div class="toast toast-center toast-top" classList={{ "hidden": !show() }}>
            <div class="alert alert-error">
                <span>{sets.err.message}</span>
                <span class="btn btn-circle btn-xs btn-outline text-red-700" onclick={[setShow, false]}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </span>
            </div>
        </div>
    );
}

export function alert(err, hideAfter = 3000) {
    document.querySelectorAll(".toast.hidden").forEach(el => el.parentNode.remove());
    render(() => <Portal>
        <Alert err={err} hideAfter={hideAfter} />
    </Portal>, document.body)
}

export function Confirm(props) {
    let [show, setShow] = createSignal(true);
    return (
        <div class="toast toast-center toast-top" classList={{ "hidden": !show() }}>
            <div role="alert" class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>{props.msg}</span>
                <div>
                    <button class="btn btn-sm" onclick={() => { setShow(false); props.cancel(); }}>取消</button>
                    <button class="btn btn-sm btn-primary" onclick={() => { setShow(false); props.then(); }}>确认</button>
                </div>
            </div>
        </div>
    );
}

export function confirm(msg, then, cancel = () => { }) {
    document.querySelectorAll(".toast.hidden").forEach(el => el.parentNode.remove());
    render(() => <Portal>
        <Confirm msg={msg} then={then} cancel={cancel} />
    </Portal>, document.body)
}

export function Pagination(props) {
    let pages = () => Math.ceil(props.total() / props.per_page());//总页数
    return (
        <div class="text-right my-0.5">
            <span class="text-xs">&nbsp;{props.total()} 项中的 {props.page() * props.per_page() - props.per_page() + 1}-{Math.min(props.page() * props.per_page(), props.total())} 项&nbsp;</span>
            <div class="join">
                <button onclick={() => props.setPage(1)} classList={{ "btn-disabled": props.page() <= 1 }} class="font-bold join-item btn btn-xs"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 17.5v-11h1v11zm10.5-.192L11.692 12L17 6.692l.708.708l-4.6 4.6l4.6 4.6z" /></svg></button>

                <Show when={props.page() > 4}>
                    <button onclick={() => props.setPage(props.page() - 4)} class="join-item btn btn-xs">{props.page() - 4}</button>
                </Show>
                <Show when={props.page() > 3}>
                    <button onclick={() => props.setPage(props.page() - 3)} class="join-item btn btn-xs">{props.page() - 3}</button>
                </Show>
                <Show when={props.page() > 2}>
                    <button onclick={() => props.setPage(props.page() - 2)} class="join-item btn btn-xs">{props.page() - 2}</button>
                </Show>
                <Show when={props.page() > 1}>
                    <button onclick={() => props.setPage(props.page() - 1)} class="join-item btn btn-xs">{props.page() - 1}</button>
                </Show>
                <button class="join-item btn btn-xs btn-primary">{props.page()}</button>
                <Show when={props.page() < pages() - 1}>
                    <button onclick={() => props.setPage(props.page() + 1)} class="join-item btn btn-xs">{props.page() + 1}</button>
                </Show>
                <Show when={props.page() < pages() - 2}>
                    <button onclick={() => props.setPage(props.page() + 2)} class="join-item btn btn-xs">{props.page() + 2}</button>
                </Show>
                <Show when={props.page() < pages() - 3}>
                    <button onclick={() => props.setPage(props.page() + 3)} class="join-item btn btn-xs">{props.page() + 3}</button>
                </Show>
                <Show when={props.page() < pages() - 4}>
                    <button onclick={() => props.setPage(props.page() + 4)} class="join-item btn btn-xs">{props.page() + 4}</button>
                </Show>
                <button onclick={() => props.setPage(pages())} classList={{ "btn-disabled": props.page() >= pages() }} class="font-bold join-item btn btn-xs"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24"><path fill="currentColor" d="m7 17.308l-.708-.708l4.6-4.6l-4.6-4.6L7 6.692L12.308 12zm9.5.192v-11h1v11z" /></svg></button>
            </div>
            &nbsp;
            <Select model={[props.per_page, props.setPer_page]} default={props.per_page()} options={[{ value: 20, label: "20/页" }, { value: 40, label: "40/页" }, { value: 100, label: "100/页" }]} class="w-20 select-xs" />
            &nbsp;跳到
            <NumberInput model={[props.page, props.setPage]} placeholder="页码" class="input-xs w-11" />
            页&nbsp;
        </div>
    );
}

export function KVbadge(props) {
    if (props.href) {
        return (<a href={props.href} target="_blank" class="items-baseline flex-nowrap text-sm bg-blue-500 rounded-lg text-white m-1">
            <span class="inline-flex rounded-s-lg px-1 py-0.5">{props.k}</span>
            <span class="inline-flex rounded-e-lg px-1 py-0.5">{props.v}</span>
        </a>);
    } else {
        return (<div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1" onclick={props.onclick} style={props.style}>
            <span class="inline-flex rounded-s-lg px-1 py-0.5">{props.k}</span>
            <span class="inline-flex bg-green-500 rounded-e-lg px-1 py-0.5">{props.v}</span>
        </div>);
    }
}
export function KVTextInput(props) {
    let input = <TextInput ref={props.ref} model={props.model} placeholder={props.k} class={"input-xs focus:outline-none text-black px-1 leading-5 h-5" + (props.class ? " " + props.class : "")} />;
    if (props.href) {
        return (<div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1">
            <a href={props.href} target="_blank" class="inline-flex rounded-s-lg px-1 py-0.5 bg-blue-500">{props.k}</a>
            <span class="inline-flex bg-green-500 rounded-e-lg px-1 py-0.5">{input}</span>
        </div>);
    } else {
        return (<div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1">
            <span class="inline-flex rounded-s-lg px-1 py-0.5">{props.k}</span>
            <span class="inline-flex bg-green-500 rounded-e-lg px-1 py-0.5">{input}</span>
        </div>);
    }
}

export function KVNumberInput(props) {
    let input = <NumberInput ref={props.ref} model={props.model} placeholder={props.k} class={"input-xs focus:outline-none text-black px-1 leading-5 h-5" + (props.class ? " " + props.class : "")} />;
    if (props.href) {
        return (<div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1 inline-block">
            <a href={props.href} target="_blank" class="inline-flex rounded-s-lg px-1 py-0.5 bg-blue-500">{props.k}</a>
            <span class="inline-flex bg-green-500 rounded-e-lg px-1 py-0.5">{input}</span>
        </div>);
    } else {
        return (<div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1">
            <span class="inline-flex rounded-s-lg px-1 py-0.5">{props.k}</span>
            <span class="inline-flex bg-green-500 rounded-e-lg px-1 py-0.5">{input}</span>
        </div>);
    }
}

export function JsonEditor(props) {
    return (
        <MonacoEditor
            options={{
                wordWrap: 'on',
                theme: "vs-dark",
                readOnly: props.readOnly || false
            }}
            language="json"
            width={props.width}
            height={props.height}
            value={props.value}
            onBeforeUnmount={props.onBeforeUnmount}
        />
    );
}

export function DiffEditor(props) {
    return (
        <MonacoDiffEditor
            options={{
                theme: "vs-dark",
            }}
            original={props.left}
            modified={props.right}
            originalLanguage={props.lang}
            modifiedLanguage={props.lang}
            onBeforeUnmount={props.onBeforeUnmount}
        />
    );
}
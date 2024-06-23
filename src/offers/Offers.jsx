import { Suspense, createResource, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { PerfixURI, useCfg } from "../utils/utils";
import { NumberInput, TextInput, Select, Switch, alert, confirm, Pagination, TextArea, KVbadge, KVTextInput, KVNumberInput, JsonEditor, DiffEditor } from "../utils/components";
import format from "html-format";

let [showEditor, setShowEditor] = createSignal(false);
let [editStr, setEditStr] = createSignal("");
let [showDiffEditor, setShowDiffEditor] = createSignal(false);
let [left, setLeft] = createSignal("");
let [right, setRight] = createSignal("");
let [lang, setLang] = createSignal("json");

export default function Offers() {
    const [searchKeys, setSearchKeys] = createStore({
        page: 1,
        per_page: 20,
        offer_id: 0,
        product_id: 0,
        model_id: "",
        supplier: "",
        pending: 999,
        deleted: false,
    });
    const [total, setTotal] = createSignal(0);
    let [offers, { mutate: setOffers, refetch: refetchOffers }] = createResource(
        () => Object.keys(searchKeys),
        () => fetch(PerfixURI + "offers/show", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(searchKeys),
        }).then(async res => {
            const r = await res.json();
            if (r.status === 0) {
                setTotal(r.data.total);
                setSearchKeys(produce(c => { c['page'] = r.data.page }));
                return r.data.offers;
            } else {
                alert(new Error(r.msg));
            }
        }).catch(err => alert(err))
    );
    const createModelHandle = (item) => {
        return [() => searchKeys[item], (v) => setSearchKeys(produce(c => { c[item] = v }))];
    }
    return (
        <div class="drawer drawer-end">
            <input id="drawer-editor-controller" type="checkbox" class="drawer-toggle" checked={showEditor()} onChange={(e) => {
                setShowEditor(e.target.checked);
            }} />
            <div class="drawer-content">
                <Show when={showDiffEditor()}>
                    <button class="btn btn-circle btn-sm btn-error fixed right-5 top-5 z-20" onclick={() => setShowDiffEditor(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div class="h-screen w-screen bg-white fixed top-0 left-0 z-10">
                        <DiffEditor left={left()} right={right()} lang={lang()} />
                    </div>
                </Show>
                <div class="bg-slate-50 pb-3">
                    <NumberInput name="offer_id" label="offer_id" model={createModelHandle("offer_id")} class="input-sm w-32" />
                    <NumberInput name="product_id" label="product_id" model={createModelHandle("product_id")} class="input-sm w-40" />
                    <TextInput name="model_id" label="货号" model={createModelHandle("model_id")} class="input-sm w-24" />
                    <TextInput name="supplier" label="供货商" model={createModelHandle("supplier")} class="input-sm w-32" />
                    <Select name="pending" label="状态" model={createModelHandle("pending")} default={searchKeys.pending} options={[{ value: 999, label: "全部" }, { value: 0, label: "正常" }, { value: -1, label: "待处理" }, { value: -2, label: "未上架" }]} class="select-sm" />
                    <Switch label="已删除" name="deleted" model={createModelHandle("deleted")} default={searchKeys.deleted} class="toggle-error" />
                    <button class="btn btn-primary btn-sm ml-4" onClick={refetchOffers}>刷新</button>
                    <button class="btn btn-primary btn-xs ml-20" onClick={() => confirm("确定忽略所有折扣价变更？", () => fetch(PerfixURI + "offers/allbetterpricechnageisok").catch(err => alert(err)))}>忽略所有折扣价变更</button>
                    <button class="btn btn-primary btn-xs ml-20" onClick={() => confirm("确定忽略所有低销品？", () => fetch(PerfixURI + "offers/alllowsalesisok").catch(err => alert(err)))}>忽略所有低销品</button>
                </div>
                <Pagination total={total} per_page={() => searchKeys.per_page} page={() => searchKeys.page} setPage={page => setSearchKeys(produce(c => { c['page'] = page }))} setPer_page={per_page => setSearchKeys(produce(c => {
                    c['page'] = Math.ceil(((c['page'] - 1) * c['per_page'] + 1) / per_page);
                    c['per_page'] = per_page;
                }))} />
                <div class="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 gap-3 p-1">
                    <Suspense fallback={<span class="loading loading-ring loading-lg"></span>}>
                        <For each={offers()}>{offer => <Offer {...offer} />}</For>
                    </Suspense>
                </div>
                <Pagination total={total} per_page={() => searchKeys.per_page} page={() => searchKeys.page} setPage={page => setSearchKeys(produce(c => { c['page'] = page }))} setPer_page={per_page => setSearchKeys(produce(c => {
                    c['page'] = Math.ceil(((c['page'] - 1) * c['per_page'] + 1) / per_page);
                    c['per_page'] = per_page;
                }))} />
            </div>
            <div class="drawer-side">
                <label for="drawer-editor-controller" aria-label="close sidebar" class="drawer-overlay"></label>
                <div class="p-1 w-1/3 min-h-full bg-base-200 text-base-content">
                    <Show when={showEditor()}>
                        <JsonEditor value={editStr()} height="100vh" readOnly={true} />
                    </Show>
                </div>
            </div>
        </div>
    );
}

function Offer(props) {
    const cfg = useCfg();
    const [offer, setOffer] = createStore(props);
    function nomalizeDateTime(timeStr) {
        const localeStr = new Date(timeStr).toLocaleString();
        return localeStr.substring(2, localeStr.lastIndexOf(":"));
    }
    let showDeletedAt = () => {
        return <span class="text-white rounded-full px-1 py-0.5" classList={{
            'bg-error': offer.deleted_at,
            'bg-primary': !offer.deleted_at
        }}>{offer.deleted_at ? nomalizeDateTime(offer.deleted_at) : "在用"}</span>;
    }
    let pending, deleted_at, tips, product_id, model_id;
    return (
        <div class="rounded-md overflow-hidden p-1" style="box-shadow: 0 0 3px 0 rgb(0 0 0 / 0.3);">
            <h6 class="truncate p-0.5">{offer.title}</h6>
            <img class="max-h-40 inline-block align-top" src={offer.cover} alt="cover" style="max-width:50%;" />
            <div class="inline-block px-1 align-top max-h-40" style="max-width:50%;">
                <Select ref={pending} model={[() => offer["pending"], (v) =>
                    fetch(PerfixURI + "offers/pending/" + offer.id + "/" + v).then(() => setOffer(produce(c => c["pending"] = v))).catch(err => { pending.value = c["pending"]; alert(err); })
                ]} default={offer.pending} options={[{ value: 0, label: "正常" }, { value: -1, label: "待处理" }, { value: -2, label: "未上架" }]} class={"select-xs block" + (offer.pending === 0 ? "" : " select-error bg-error text-white")} />
                <div class="pt-1.5">
                    <Switch ref={deleted_at} model={[() => offer.deleted_at, (v) =>
                        fetch(PerfixURI + "offers/delete/" + offer.id + "/" + !!v)
                            .then(() => setOffer(produce(c => c["deleted_at"] = v ? new Date().toISOString() : null)))
                            .catch(err => {
                                deleted_at.checked = !!c["deleted_at"];
                                alert(err);
                            })
                    ]} default={!!offer.deleted_at} class="toggle-sm toggle-error focus:outline-none" />
                    <span class="text-xs relative bottom-1.5">{showDeletedAt()}</span>
                </div>
                <TextArea ref={tips} placeholder="tips" class={"textarea-xs w-full h-24 max-h-24 leading-tight" + (offer.tips.trim().length > 0 ? " textarea-error bg-error text-white" : "")} model={[() => offer["tips"], (v) =>
                    fetch(PerfixURI + "offers/tips", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: offer.id, tips: v })
                    }).then(() => setOffer(produce(c => c["tips"] = v))).catch(err => { tips.value = c["tips"]; alert(err); })
                ]} />
            </div>
            <div class="pt-2 flex flex-wrap justify-center">
                <KVbadge k="id" v={offer.id} />
                <KVbadge href={cfg().OFFER_URL_PATTERN.replace("{OFFER_ID}", offer.offer_id)} k="offer_id" v={offer.offer_id} />
                <KVNumberInput ref={product_id} href={cfg().PRODUCT_URL_PATTERN.replace("{PRODUCT_ID}", offer.product_id)} class="w-32" k="product_id" model={[() => offer["product_id"], (v) =>
                    fetch(PerfixURI + "offers/pid/" + offer.id + "/" + v).then(() => setOffer(produce(c => c["product_id"] = v))).catch(err => { product_id.value = c["product_id"]; alert(err); })
                ]} />
                <KVbadge k="月销量" v={offer.sale30} onclick={async () => {
                    setEditStr(offer.sale_record);
                    setShowEditor(true);
                }} style="cursor: pointer;" />
                <div class="items-baseline flex-nowrap text-sm bg-slate-500 rounded-lg text-white m-1">
                    <button class="btn btn-primary btn-xs" onClick={() => {
                        setEditStr(offer.sale_info);
                        setShowEditor(true);
                    }}>销量总览</button>
                </div>
                <KVTextInput ref={model_id} class="w-12" k="model_id" model={[() => offer["model_id"], (v) =>
                    fetch(PerfixURI + "offers/mid/" + offer.id + "/" + v).then(() => setOffer(produce(c => c["model_id"] = v))).catch(err => { model_id.value = c["model_id"]; alert(err); })
                ]} />
                <KVbadge k="原￥" v={offer.price / 100} />
                <KVbadge k="现￥" v={offer.better_price / 100} />
                <KVbadge k="折扣" v={offer.discount + "%"} />
                <KVbadge k="SKU" v="DIFF" onclick={async () => {
                    setLeft(offer.sku_info_use);
                    setRight(offer.sku_info);
                    setLang("json");
                    setShowDiffEditor(true);
                }} style="cursor: pointer;" />
                <KVbadge k="详描" v="DIFF" onclick={async () => {
                    let a = await (await fetch(offer.detail_url_use)).text();
                    a = format(JSON.parse(a.substring(18, a.length - 1)).content);
                    let b = await (await fetch(offer.detail_url)).text();
                    b = format(JSON.parse(b.substring(18, b.length - 1)).content);
                    setLeft(a);
                    setRight(b);
                    setLang("html");
                    setShowDiffEditor(true);
                }} style="cursor: pointer;" />
                <KVbadge href={offer.store_url} k="供货商" v={offer.supplier} />
                <KVbadge k="创建" v={nomalizeDateTime(offer.created_at)} />
                <KVbadge k="更新" v={nomalizeDateTime(offer.updated_at)} />
                <Show when={offer.promotion_end}>
                    <KVbadge k="活动有效期" v={nomalizeDateTime(offer.promotion_end)} />
                </Show>
            </div>
        </div>
    );
}
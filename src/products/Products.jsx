import { Suspense, createResource, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { PerfixURI, useCfg } from "../utils/utils";
import { NumberInput, Select, Switch, alert, confirm, Pagination, TextArea, KVbadge, KVNumberInput, JsonEditor } from "../utils/components";

let [showEditor, setShowEditor] = createSignal(false);
let [editStr, setEditStr] = createSignal("");
let [detail, setDetail] = createSignal("");
let [summary, setSummary] = createSignal("");
let [saleSum, setSaleSum] = createSignal(0);
let [adviseStockNum, setAdviseStockNum] = createSignal(0);
let [adviseStock, setAdviseStock] = createSignal("");
let beforeEditorClose = () => { };

//根据建议库存量num和销量detail计算出详细建议库存量，注意传入的detail会被改变
function compute_advise_stock() {
    let detailObj = JSON.parse(detail());
    for (let color in detailObj) {
        for (let size in detailObj[color]) {
            detailObj[color][size] =
                saleSum() ? ((detailObj[color][size] * adviseStockNum()) / saleSum()).toFixed(2) : 0;
        }
    }
    return JSON.stringify(detailObj, null, 2);
}

export default function Products() {
    const [searchKeys, setSearchKeys] = createStore({
        page: 1,
        per_page: 20,
        offer_id: 0,
        product_id: 0,
        inited_weight: -1,
        pending: 999,
        deleted: false,
    });
    const [total, setTotal] = createSignal(0);
    const [discount, setDiscount] = createSignal(0);
    let [products, { mutate: setProducts, refetch: refetchProducts }] = createResource(
        () => Object.keys(searchKeys),
        () => fetch(PerfixURI + "products/show", {
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
                return r.data.products;
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
                <div class="bg-slate-50 pb-3">
                    <NumberInput name="offer_id" label="offer_id" model={createModelHandle("offer_id")} class="input-sm w-32" />
                    <NumberInput name="product_id" label="product_id" model={createModelHandle("product_id")} class="input-sm w-40" />
                    <Select name="pending" label="状态" model={createModelHandle("pending")} default={searchKeys.pending} options={[{ value: 999, label: "全部" }, { value: 0, label: "正常" }, { value: -1, label: "待处理" }, { value: -2, label: "待下架" }]} class="select-sm" />
                    <Select name="inited_weight" label="重量初始" model={createModelHandle("inited_weight")} default={searchKeys.pending} options={[{ value: -1, label: "全部" }, { value: 1, label: "已初始化" }, { value: 0, label: "未初始化" }]} class="select-sm" />
                    <Switch label="已删除" name="deleted" model={createModelHandle("deleted")} default={searchKeys.deleted} class="toggle-error" />
                    <button class="btn btn-primary btn-sm ml-4" onClick={refetchProducts}>刷新</button>
                    <KVNumberInput href={PerfixURI + "products/dl_discount_xslx/" + discount()} class="w-12" k="↓折扣↓" model={[discount, setDiscount]} />
                    <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="file-input file-input-bordered file-input-xs file-input-primary w-20 max-w-xs" onchange={(e) => {
                        let fileName = e.target.files[0].name;
                        let fd = new FormData();
                        fd.append("file", e.target.files[0]);
                        confirm(
                            "确定上传" + fileName + "？"
                            , () =>
                                fetch(PerfixURI + "products/upload_xlsx", {
                                    method: "POST",
                                    body: fd,
                                }).catch(err => { pending.value = c["pending"]; alert(err); }).finally(() => e.target.value = "")
                            , () => e.target.value = "",
                        );
                    }} />
                    <button class="btn btn-primary btn-xs ml-20" onClick={() => confirm("确定忽略所有下架建议？", () => fetch(PerfixURI + "products/available").catch(err => alert(err)))}>忽略所有下架建议</button>
                </div>
                <Pagination total={total} per_page={() => searchKeys.per_page} page={() => searchKeys.page} setPage={page => setSearchKeys(produce(c => { c['page'] = page }))} setPer_page={per_page => setSearchKeys(produce(c => {
                    c['page'] = Math.ceil(((c['page'] - 1) * c['per_page'] + 1) / per_page);
                    c['per_page'] = per_page;
                }))} />
                <div class="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 gap-3 p-1">
                    <Suspense fallback={<span class="loading loading-ring loading-lg"></span>}>
                        <For each={products()}>{product => <Product {...product} />}</For>
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
                        <JsonEditor value={editStr()} height="80vh" onBeforeUnmount={(monaco, editor) => {
                            beforeEditorClose(editor.getValue());
                        }} />
                        <div class="break-all text-wrap bg-slate-50 m-2 p-1">{summary()}</div>
                        <div class="bg-slate-50 m-2 p-1">
                            建议库存总量:
                            <NumberInput name="advise_stock_num" model={[adviseStockNum, (v) => {
                                setAdviseStockNum(v);
                                setAdviseStock(compute_advise_stock());
                            }]} class="input-sm" />
                        </div>
                        <pre class="bg-slate-50 m-2 p-1">{adviseStock()}</pre>
                    </Show>
                </div>
            </div>
        </div>
    );
}

function Product(props) {
    const cfg = useCfg();
    const [product, setProduct] = createStore(props);
    function nomalizeDateTime(timeStr) {
        const localeStr = new Date(timeStr).toLocaleString();
        return localeStr.substring(2, localeStr.lastIndexOf(":"));
    }
    let showDeletedAt = () => {
        return <span class="text-white rounded-full px-1 py-0.5" classList={{
            'bg-error': product.deleted_at,
            'bg-primary': !product.deleted_at
        }}>{product.deleted_at ? nomalizeDateTime(product.deleted_at) : "在用"}</span>;
    }
    let pending, deleted_at, tips, offer_id, inited_weight, discount;
    return (
        <div class="rounded-md overflow-hidden p-1" style="box-shadow: 0 0 3px 0 rgb(0 0 0 / 0.3);">
            <h6 class="truncate p-0.5">{product.title}</h6>
            <img class="max-h-40 inline-block align-top" src={product.cover} alt="cover" style="max-width:50%;" />
            <div class="inline-block px-1 align-top max-h-40" style="max-width:50%;">
                <Select ref={pending} model={[() => product["pending"], (v) =>
                    fetch(PerfixURI + "products/pending/" + product.id + "/" + v).then(() => setProduct(produce(c => c["pending"] = v))).catch(err => { pending.value = c["pending"]; alert(err); })
                ]} default={product.pending} options={[{ value: 0, label: "正常" }, { value: -1, label: "待处理" }, { value: -2, label: "待下架" }]} class={"select-xs" + (product.pending === 0 ? "" : " select-error bg-error text-white")} />
                <button title="销毁库存信息以便重建" class="btn btn-error btn-xs text-white ml-2" onClick={() => confirm("确定销毁库存信息？", () => fetch(PerfixURI + "products/clear_stock_info/" + product.id).then(() => setProduct(produce(c => c["stock_info"] = ""))).catch(err => alert(err)))}>毁库</button>
                <div class="pt-1.5">
                    <Switch ref={deleted_at} model={[() => product.deleted_at, (v) =>
                        fetch(PerfixURI + "products/delete/" + product.id + "/" + !!v)
                            .then(() => setProduct(produce(c => c["deleted_at"] = v ? new Date().toISOString() : null)))
                            .catch(err => {
                                deleted_at.checked = !!c["deleted_at"];
                                alert(err);
                            })
                    ]} default={!!product.deleted_at} class="toggle-sm toggle-error focus:outline-none" />
                    <span class="text-xs relative bottom-1.5">{showDeletedAt()}</span>
                </div>
                <div class="pt-1.5">
                    <Switch ref={inited_weight} model={[() => product.inited_weight, (v) =>
                        fetch(PerfixURI + "products/inited_weight/" + product.id + "/" + !!v)
                            .then(() => setProduct(produce(c => c["inited_weight"] = v ? 1 : 0)))
                            .catch(err => {
                                inited_weight.checked = !!c["inited_weight"];
                                alert(err);
                            })
                    ]} default={!!product.inited_weight} class="toggle-sm toggle-primary focus:outline-none" />
                    <span class="text-xs relative bottom-1.5">{product.inited_weight ? "重量已初始" : "重量未初始"}</span>
                </div>
                <TextArea ref={tips} placeholder="tips" class={"textarea-xs w-full h-16 max-h-16 leading-tight" + (product.tips.trim().length > 0 ? " textarea-error bg-error text-white" : "")} model={[() => product["tips"], (v) =>
                    fetch(PerfixURI + "products/tips", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: product.id, tips: v })
                    }).then(() => setProduct(produce(c => c["tips"] = v))).catch(err => { tips.value = c["tips"]; alert(err); })
                ]} />
            </div>
            <div class="pt-2 flex flex-wrap justify-center">
                <KVbadge k="id" v={product.id} />
                <KVNumberInput ref={offer_id} href={cfg().OFFER_URL_PATTERN.replace("{OFFER_ID}", product.offer_id)} class="w-24" k="offer_id" model={[() => product["offer_id"], (v) =>
                    fetch(PerfixURI + "products/oid/" + product.id + "/" + v).then(() => setProduct(produce(c => c["offer_id"] = v))).catch(err => { offer_id.value = c["offer_id"]; alert(err); })
                ]} />
                <KVbadge href={cfg().PRODUCT_URL_PATTERN.replace("{PRODUCT_ID}", product.product_id)} k="product_id" v={product.product_id} />
                <KVbadge k="货号" v={product.model_id} />
                <KVbadge k="月uv" v={product.uv30} />
                <KVbadge k="月销量" v={product.sales30} />
                <KVbadge k="价格$" v={product.price / 100} />
                <KVNumberInput ref={discount} class="w-20" k="额外折扣%" model={[() => product.discount, (v) =>
                    fetch(PerfixURI + "products/discount/" + product.id + "/" + v).then(() => setProduct(produce(c => c["discount"] = v))).catch(err => { discount.value = c["discount"]; alert(err); })
                ]} />
                <KVbadge k="库存" v={product.stock_count} onclick={async () => {
                    setEditStr(product.stock_info);
                    beforeEditorClose = (value) => {
                        if (value !== editStr()) {
                            setEditStr(value);
                            fetch(PerfixURI + "products/update_info", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    id: product.id,
                                    column: "stock_info",
                                    info: value,
                                }),
                            })
                                .then(() => setProduct(produce(c => c["stock_info"] = value)))
                                .catch(err => alert(err))
                        }
                    };

                    let summary = { color: {}, size: {} };
                    let detailObj = JSON.parse(product.stock_info);
                    for (let color in detailObj) {
                        if (summary.color[color] === undefined) {
                            summary.color[color] = 0;
                        }
                        for (let size in detailObj[color]) {
                            if (summary.size[size] === undefined) {
                                summary.size[size] = 0;
                            }
                            summary.color[color] += detailObj[color][size];
                            summary.size[size] += detailObj[color][size];
                        }
                    }
                    setSaleSum(product.sale_count);
                    setDetail(product.sale_info);
                    setAdviseStockNum(product.sales30 * cfg().SALE2STOCK);
                    setSummary(JSON.stringify(summary));
                    setAdviseStock(compute_advise_stock());

                    setShowEditor(true);
                }} style="cursor: pointer;" />
                <KVbadge k="销量" v={product.sale_count} onclick={async () => {
                    setEditStr(product.sale_info);
                    beforeEditorClose = (value) => {
                        if (value !== editStr()) {
                            setEditStr(value);
                            fetch(PerfixURI + "products/update_info", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    id: product.id,
                                    column: "sale_info",
                                    info: value,
                                }),
                            })
                                .then(() => setProduct(produce(c => c["sale_info"] = value)))
                                .catch(err => alert(err))
                        }
                    }

                    let summary = { color: {}, size: {} };
                    let detailObj = JSON.parse(product.sale_info);
                    for (let color in detailObj) {
                        if (summary.color[color] === undefined) {
                            summary.color[color] = 0;
                        }
                        for (let size in detailObj[color]) {
                            if (summary.size[size] === undefined) {
                                summary.size[size] = 0;
                            }
                            summary.color[color] += detailObj[color][size];
                            summary.size[size] += detailObj[color][size];
                        }
                    }
                    setSaleSum(product.sale_count);
                    setDetail(product.sale_info);
                    setAdviseStockNum(product.sales30 * cfg().SALE2STOCK);
                    setSummary(JSON.stringify(summary));
                    setAdviseStock(compute_advise_stock());

                    setShowEditor(true);
                }} style="cursor: pointer;" />
                <KVbadge k="重量" v={
                    product.sale_weight / 1000
                    + "Kg ÷ "
                    + product.weight_cal_count
                    + " = "
                    + (product.weight_cal_count ? (product.sale_weight / 1000 / product.weight_cal_count).toFixed(3) : 0)
                    + "Kg"
                } />
                <KVbadge k="建议重量" v={product.weight / 1000 + "Kg"} />
                <KVbadge k="创建" v={nomalizeDateTime(product.created_at)} />
                <KVbadge k="更新" v={nomalizeDateTime(product.updated_at)} />
            </div>
        </div>
    );
}
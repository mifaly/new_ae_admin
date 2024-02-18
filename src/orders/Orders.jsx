import { Suspense, createResource, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { PerfixURI, useCfg } from "../utils/utils";
import { NumberInput, alert, Pagination, KVbadge, JsonEditor } from "../utils/components";

let [showEditor, setShowEditor] = createSignal(false);
let [editStr, setEditStr] = createSignal("");

export default function Orders() {
    const [searchKeys, setSearchKeys] = createStore({
        page: 1,
        per_page: 20,
        order_id: 0,
        product_id: 0,
    });
    const [total, setTotal] = createSignal(0);
    let [orders, { mutate: setOrders, refetch: refetchOrders }] = createResource(
        () => Object.keys(searchKeys),
        () => fetch(PerfixURI + "orders/show", {
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
                return r.data.orders;
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
                    <NumberInput name="order_id" label="order_id" model={createModelHandle("order_id")} class="input-sm w-40" />
                    <NumberInput name="product_id" label="product_id" model={createModelHandle("product_id")} class="input-sm w-40" />
                    <button class="btn btn-primary btn-sm ml-4" onClick={refetchOrders}>刷新</button>
                </div>
                <Pagination total={total} per_page={() => searchKeys.per_page} page={() => searchKeys.page} setPage={page => setSearchKeys(produce(c => { c['page'] = page }))} setPer_page={per_page => setSearchKeys(produce(c => {
                    c['page'] = Math.ceil(((c['page'] - 1) * c['per_page'] + 1) / per_page);
                    c['per_page'] = per_page;
                }))} />
                <div class="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 gap-3 p-1">
                    <Suspense fallback={<span class="loading loading-ring loading-lg"></span>}>
                        <For each={orders()}>{order => <Order {...order} />}</For>
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

function Order(props) {
    const cfg = useCfg();
    const [order, setOrder] = createStore(props);
    function nomalizeDateTime(timeStr) {
        const localeStr = new Date(timeStr).toLocaleString();
        return localeStr.substring(2, localeStr.lastIndexOf(":"));
    }
    return (
        <div class="rounded-md overflow-hidden p-1" style="box-shadow: 0 0 3px 0 rgb(0 0 0 / 0.3);">
            <h6 class="truncate p-0.5 text-center">{order.order_id}</h6>
            <div class="pt-2 flex flex-wrap justify-center">
                <KVbadge k="id" v={order.id} />
                <KVbadge href={cfg().ORDER_URL_PATTERN.replace("{ORDER_ID}", order.order_id)} k="order_id" v={order.order_id} />
                <KVbadge href={order.lg_order_id ? cfg().LG_ORDER_URL_PATTERN.replace("{LG_ORDER_ID}", order.lg_order_id) : null} k="lg_order_id" v={order.lg_order_id || "无"} />
                <KVbadge k="备注" v={order.remark || "空"} />
                <KVbadge k="包裹重量" v={order.weight / 1000 + "kg"} />
                <KVbadge k="包含商品" v={ order.product_num + "种" + order.item_num + "件"} />
                <KVbadge k="使用库存" v="明细" onclick={async () => {
                    setEditStr(order.used_stock);
                    setShowEditor(true);
                }} />
                <KVbadge k="创建" v={nomalizeDateTime(order.created_at)} />
                <KVbadge k="更新" v={nomalizeDateTime(order.updated_at)} />
                <p>{ order.products }</p>
            </div>
        </div>
    );
}
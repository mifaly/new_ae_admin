import { useTransition, createSignal, lazy } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { CfgProvider } from "./utils/utils";
function App() {
  const tabs = [
    { name: 'offers', component: lazy(() => import("./offers/Offers")) },
    { name: 'products', component: lazy(() => import("./products/Products")) },
    { name: 'orders', component: lazy(() => import("./orders/Orders")) }
  ];
  const [activeTab, setActiveTab] = createSignal(0);
  const [pending, start] = useTransition();
  const openTab = (index) => () => start(() => setActiveTab(index));

  return (
    <>
      <div role="tablist" class="tabs tabs-boxed tabs-md bg-slate-200">
        <For each={tabs}>
          {(tab, i) => {
            let isActive = () => activeTab() === i();
            return (<span role="tab" class="tab" classList={{ 'tab-active': isActive() }} onclick={openTab(i())}>{tab.name}</span>);
          }}
        </For>
      </div>
      <CfgProvider>
        <Dynamic component={tabs[activeTab()].component} />
      </CfgProvider>
    </>
  );
}

export default App;

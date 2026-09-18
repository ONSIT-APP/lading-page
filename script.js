
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function selectAudience(id, moveFocus = false) {
  if (!tabs.some((tab) => tab.dataset.audience === id)) return;
  for (const tab of tabs) {
    const active = tab.dataset.audience === id;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  }
  for (const panel of panels) panel.hidden = panel.id !== `panel-${id}`;
}
for (const tab of tabs) {
  tab.addEventListener("click", () => selectAudience(tab.dataset.audience));
  tab.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(tab);
    const target = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    selectAudience(tabs[target].dataset.audience, true);
  });
}
const aliases = { candidato: "pessoas", empresa: "empresas", governo: "governos" };
const query = new URLSearchParams(location.search).get("publico");
if (query) selectAudience(aliases[query] || query);
function selectHashAudience() {
  const id = location.hash.slice(1).replace(/^tab-/, "");
  if (!tabs.some((tab) => tab.dataset.audience === id)) return;
  selectAudience(id);
  document.getElementById("solucoes").scrollIntoView({ behavior: "instant" });
}
window.addEventListener("hashchange", selectHashAudience);
selectHashAudience();

for (const link of document.querySelectorAll('a[href^="#tab-"]')) {
  link.addEventListener("click", () => selectAudience(link.hash.slice(5)));
}

import { getTopFrame, getNamedFrame } from "./run.js";
function isRuntimeNavigation(info) {
    return typeof info === 'object' && info != null && '$rmx' in info;
}
export async function navigate(href, src, target) {
    let navigation = getNavigation().navigate(href, {
        state: { target: target ?? undefined, src: src ?? href, $rmx: true },
    });
    await navigation.finished;
}
export function startNavigationListener(signal) {
    let navigation = getNavigation();
    navigation.updateCurrentEntry({
        state: { target: undefined, src: window.location.href, $rmx: true },
    });
    document.addEventListener('click', (event) => {
        if (!(event.target instanceof HTMLElement))
            return;
        let anchor = event.target.closest('a');
        if (!anchor)
            return;
        let href = anchor.href;
        if (!href)
            return;
        let target = anchor.getAttribute('rmx-target');
        let src = anchor.getAttribute('rmx-src');
        event.preventDefault();
        navigate(anchor.href, src, target);
    }, { signal: signal });
    navigation.addEventListener('navigate', (event) => {
        if (!event.canIntercept)
            return;
        let info = event.destination.getState();
        if (!isRuntimeNavigation(info))
            return;
        let topFrame = getTopFrame();
        let namedFrame = info.target ? getNamedFrame(info.target) : undefined;
        let frame = namedFrame ?? topFrame;
        frame.src = frame === topFrame ? event.destination.url : info.src;
        event.intercept({
            async handler() {
                await frame.reload();
            },
        });
    }, { signal });
}
function getNavigation() {
    let navigation = window.navigation;
    if (!navigation)
        throw new Error('Navigation API is not available');
    return navigation;
}
//# sourceMappingURL=navigate.js.map
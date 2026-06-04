declare module '@/routes' {
    export const home: any;
    const routes: Record<string, any>;
    export default routes;
}

declare module '@/routes/*' {
    const route: any;
    export default route;
    export const index: any;
    export const create: any;
    export const store: any;
    export const show: any;
    export const edit: any;
    export const update: any;
    export const destroy: any;
}

declare module '@/actions/*' {
    const action: any;
    export default action;
}

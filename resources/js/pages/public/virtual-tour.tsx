import TourAreaPreviewDialog from '@/components/public/tour-area-preview-dialog';
import {
    TOUR_AREAS,
    TOUR_LAUNCH_STEPS,
    TOUR_MEDIA_SPECS,
    TOUR_RELEASE_CHECKLIST,
    TOUR_STREET_VIEW_GUIDANCE,
    type TourArea,
} from '@/data/bccc-tour-areas';
import PublicLayout from '@/layouts/public-layout';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarDays,
    Camera,
    CheckCircle2,
    Compass,
    FileImage,
    LayoutDashboard,
    Map,
    MapPinned,
    Maximize2,
    Minimize2,
    MousePointer2,
    Navigation,
    RotateCcw,
    Route,
    ScanEye,
    Sparkles,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ThreeRenderer = import('three').WebGLRenderer;
type ThreeScene = import('three').Scene;
type ThreeCamera = import('three').PerspectiveCamera;
type ThreeMesh = import('three').Mesh;
type ThreeMaterial = import('three').Material;
type ThreeTexture = import('three').Texture;
type ThreeGeometry = import('three').BufferGeometry;

type TourViewCommand = {
    type: 'reset';
};

const ease = [0.22, 1, 0.36, 1] as const;
const VISIT_ROUTE_AREAS = TOUR_AREAS.filter((area) => area.id !== 'whole-tour');

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function useFullscreenViewer() {
    const shellRef = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const isViewerExpanded = isFullscreen || isExpanded;

    const requestViewerResize = useCallback(() => {
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 180);
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreen = document.fullscreenElement === shellRef.current;

            setIsFullscreen(fullscreen);

            if (fullscreen) {
                setIsExpanded(false);
            }

            requestViewerResize();
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
        };
    }, [requestViewerResize]);

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExpanded(false);
                requestViewerResize();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isExpanded, requestViewerResize]);

    useEffect(() => {
        if (!isViewerExpanded) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.documentElement.classList.add('bccc-viewer-is-expanded');
        document.body.classList.add('bccc-viewer-is-expanded');
        document.body.style.overflow = 'hidden';

        return () => {
            document.documentElement.classList.remove(
                'bccc-viewer-is-expanded',
            );
            document.body.classList.remove('bccc-viewer-is-expanded');
            document.body.style.overflow = previousOverflow;
        };
    }, [isViewerExpanded]);

    const toggleFullscreen = useCallback(async () => {
        const shell = shellRef.current;

        if (!shell) {
            return;
        }

        if (document.fullscreenElement === shell) {
            try {
                await document.exitFullscreen();
            } catch {
                setIsFullscreen(false);
            }

            setIsExpanded(false);
            requestViewerResize();

            return;
        }

        if (isExpanded) {
            setIsExpanded(false);
            requestViewerResize();

            return;
        }

        try {
            if (shell.requestFullscreen) {
                await shell.requestFullscreen({ navigationUI: 'hide' });
                setIsFullscreen(true);
                setIsExpanded(false);
                requestViewerResize();

                return;
            }
        } catch {
            // Some browsers reject fullscreen outside strict platform rules.
        }

        setIsFullscreen(false);
        setIsExpanded(true);
        requestViewerResize();
    }, [isExpanded, requestViewerResize]);

    return {
        isViewerExpanded,
        shellRef,
        toggleFullscreen,
    };
}

function TourScene({
    activeArea,
    nextArea,
    previousArea,
    onMoveToArea,
}: {
    activeArea: TourArea;
    nextArea: TourArea;
    previousArea: TourArea;
    onMoveToArea: (area: TourArea) => void;
}) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const reduceMotion = Boolean(useReducedMotion());
    const [fieldOfView, setFieldOfView] = useState(68);
    const fieldOfViewRef = useRef(fieldOfView);
    const viewControlRef = useRef<((command: TourViewCommand) => void) | null>(
        null,
    );

    useEffect(() => {
        fieldOfViewRef.current = fieldOfView;
    }, [fieldOfView]);

    const adjustZoom = (amount: number) => {
        setFieldOfView((current) =>
            Math.min(84, Math.max(42, current + amount)),
        );
    };
    const resetView = () => {
        viewControlRef.current?.({ type: 'reset' });
        setFieldOfView(68);
    };
    const moveToArea = useCallback(
        (area: TourArea) => {
            onMoveToArea(area);
            setFieldOfView(68);
        },
        [onMoveToArea],
    );

    useEffect(() => {
        const mount = mountRef.current;

        if (!mount) {
            return;
        }

        const mountElement = mount;
        let disposed = false;
        let frame = 0;
        let renderer: ThreeRenderer | null = null;
        let scene: ThreeScene | null = null;
        let camera: ThreeCamera | null = null;
        let panorama: ThreeMesh | null = null;
        let removePointerListeners = () => {};
        const materials: ThreeMaterial[] = [];
        const textures: ThreeTexture[] = [];
        const geometries: ThreeGeometry[] = [];

        async function init() {
            try {
                const THREE = await import('three');

                if (disposed) {
                    return;
                }

                scene = new THREE.Scene();
                scene.fog = new THREE.Fog(0x061514, 280, 620);

                camera = new THREE.PerspectiveCamera(
                    fieldOfViewRef.current,
                    Math.max(mountElement.clientWidth, 1) /
                        Math.max(mountElement.clientHeight, 1),
                    0.1,
                    1100,
                );
                camera.position.set(0, 0, 0.01);

                renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                });
                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, 2),
                );
                renderer.setSize(
                    Math.max(mountElement.clientWidth, 1),
                    Math.max(mountElement.clientHeight, 1),
                );
                renderer.domElement.className =
                    'h-full w-full touch-none outline-none';
                renderer.domElement.setAttribute(
                    'aria-label',
                    `${activeArea.label} street-view style panorama preview`,
                );
                renderer.domElement.setAttribute('role', 'img');
                renderer.domElement.style.cursor = 'grab';
                mountElement.appendChild(renderer.domElement);

                const loader = new THREE.TextureLoader();
                const texture = loader.load(activeArea.image);
                texture.colorSpace = THREE.SRGBColorSpace;
                textures.push(texture);

                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide,
                });
                materials.push(material);

                const geometry = new THREE.SphereGeometry(500, 96, 56);
                geometries.push(geometry);

                panorama = new THREE.Mesh(geometry, material);
                scene.add(panorama);

                const compassGeometry = new THREE.RingGeometry(58, 60, 96);
                geometries.push(compassGeometry);
                const compassMaterial = new THREE.MeshBasicMaterial({
                    color: 0xf4dfad,
                    transparent: true,
                    opacity: 0.26,
                    side: THREE.DoubleSide,
                });
                materials.push(compassMaterial);
                const compass = new THREE.Mesh(
                    compassGeometry,
                    compassMaterial,
                );
                compass.rotation.x = Math.PI / 2;
                compass.position.y = -46;
                scene.add(compass);

                let lon = -92;
                let lat = -2;
                let startLon = lon;
                let startLat = lat;
                let startX = 0;
                let startY = 0;
                let dragging = false;
                const target = new THREE.Vector3();

                viewControlRef.current = (command) => {
                    if (command.type === 'reset') {
                        lon = -92;
                        lat = -2;
                    }
                };

                const updateCameraTarget = () => {
                    if (!camera) {
                        return;
                    }

                    lat = Math.max(-72, Math.min(72, lat));
                    const phi = THREE.MathUtils.degToRad(90 - lat);
                    const theta = THREE.MathUtils.degToRad(lon);

                    target.x = 500 * Math.sin(phi) * Math.cos(theta);
                    target.y = 500 * Math.cos(phi);
                    target.z = 500 * Math.sin(phi) * Math.sin(theta);
                    camera.lookAt(target);
                };

                const handlePointerDown = (event: PointerEvent) => {
                    dragging = true;
                    startX = event.clientX;
                    startY = event.clientY;
                    startLon = lon;
                    startLat = lat;
                    renderer?.domElement.style.setProperty(
                        'cursor',
                        'grabbing',
                    );
                    renderer?.domElement.setPointerCapture(event.pointerId);
                };

                const handlePointerMove = (event: PointerEvent) => {
                    if (!dragging) {
                        return;
                    }

                    lon = startLon - (event.clientX - startX) * 0.11;
                    lat = startLat + (event.clientY - startY) * 0.11;
                };

                const handlePointerUp = (event: PointerEvent) => {
                    dragging = false;
                    renderer?.domElement.style.setProperty('cursor', 'grab');
                    try {
                        renderer?.domElement.releasePointerCapture(
                            event.pointerId,
                        );
                    } catch {
                        // Pointer capture can already be released by the browser.
                    }
                };

                const handleWheel = (event: WheelEvent) => {
                    event.preventDefault();
                    setFieldOfView((current) =>
                        Math.min(
                            84,
                            Math.max(42, current + Math.sign(event.deltaY) * 4),
                        ),
                    );
                };
                const handleKeyDown = (event: KeyboardEvent) => {
                    if (
                        event.key === 'ArrowLeft' ||
                        event.key === 'ArrowDown'
                    ) {
                        event.preventDefault();
                        moveToArea(previousArea);
                    }

                    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveToArea(nextArea);
                    }
                };

                renderer.domElement.tabIndex = 0;
                renderer.domElement.addEventListener(
                    'pointerdown',
                    handlePointerDown,
                );
                renderer.domElement.addEventListener('wheel', handleWheel, {
                    passive: false,
                });
                renderer.domElement.addEventListener('keydown', handleKeyDown);
                window.addEventListener('pointermove', handlePointerMove);
                window.addEventListener('pointerup', handlePointerUp);

                removePointerListeners = () => {
                    renderer?.domElement.removeEventListener(
                        'pointerdown',
                        handlePointerDown,
                    );
                    renderer?.domElement.removeEventListener(
                        'wheel',
                        handleWheel,
                    );
                    renderer?.domElement.removeEventListener(
                        'keydown',
                        handleKeyDown,
                    );
                    window.removeEventListener(
                        'pointermove',
                        handlePointerMove,
                    );
                    window.removeEventListener('pointerup', handlePointerUp);
                };

                const handleResize = () => {
                    if (!renderer || !camera) {
                        return;
                    }

                    camera.aspect =
                        Math.max(mountElement.clientWidth, 1) /
                        Math.max(mountElement.clientHeight, 1);
                    camera.updateProjectionMatrix();
                    renderer.setSize(
                        Math.max(mountElement.clientWidth, 1),
                        Math.max(mountElement.clientHeight, 1),
                    );
                };

                window.addEventListener('resize', handleResize);

                const clock = new THREE.Clock();

                const render = () => {
                    if (!renderer || !scene || !camera || disposed) {
                        return;
                    }

                    const elapsed = clock.getElapsedTime();
                    if (!dragging && !reduceMotion) {
                        lon += Math.sin(elapsed * 0.12) * 0.003;
                    }

                    camera.fov = fieldOfViewRef.current;
                    camera.updateProjectionMatrix();
                    updateCameraTarget();

                    renderer.render(scene, camera);
                    frame = window.requestAnimationFrame(render);
                };

                render();

                removePointerListeners = (() => {
                    const removeBaseListeners = removePointerListeners;

                    return () => {
                        removeBaseListeners();
                        window.removeEventListener('resize', handleResize);
                    };
                })();
            } catch {
                mountElement.dataset.webglUnavailable = 'true';
            }
        }

        void init();

        return () => {
            disposed = true;
            window.cancelAnimationFrame(frame);
            removePointerListeners();
            viewControlRef.current = null;

            materials.forEach((material) => material.dispose());
            textures.forEach((texture) => texture.dispose());
            geometries.forEach((geometry) => geometry.dispose());

            if (renderer?.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }

            renderer?.dispose();
            scene?.clear();
            panorama?.clear();
        };
    }, [activeArea, moveToArea, nextArea, previousArea, reduceMotion]);

    return (
        <div className="bccc-virtual-tour-viewport absolute inset-0">
            <div
                ref={mountRef}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(244,223,173,0.16),transparent_34%),linear-gradient(135deg,#061514,#10372f_48%,#040707)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.76),rgba(0,0,0,0.34)_38%,rgba(0,0,0,0.1)_62%,rgba(0,0,0,0.58))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/14 bg-black/32 px-3 py-2 text-[10px] font-black tracking-[0.16em] text-white/78 uppercase backdrop-blur-xl">
                Street-view lens
            </div>
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/18">
                <span className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4dfad]" />
            </div>

            <div className="absolute top-4 right-4 left-4 flex items-start justify-end gap-3 sm:left-auto">
                <div className="rounded-lg border border-white/12 bg-black/42 p-3 backdrop-blur-xl max-sm:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                            <MousePointer2 className="h-3.5 w-3.5" />
                            Interactive preview
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-black text-white/54">
                            {activeArea.shortLabel}
                        </span>
                    </div>
                </div>
                <div className="bccc-tour-scene-toolbar flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-black/44 p-1.5 backdrop-blur-xl">
                    <button
                        type="button"
                        onClick={() => adjustZoom(5)}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/74 transition hover:bg-white/14 hover:text-white"
                        title="Zoom out"
                    >
                        <ZoomOut className="h-4 w-4" />
                        <span className="sr-only">Zoom out</span>
                    </button>
                    <span className="min-w-16 text-center text-[10px] font-black tracking-[0.14em] text-white/54 uppercase">
                        {Math.round(126 - fieldOfView)}%
                    </span>
                    <button
                        type="button"
                        onClick={() => adjustZoom(-5)}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/74 transition hover:bg-white/14 hover:text-white"
                        title="Zoom in"
                    >
                        <ZoomIn className="h-4 w-4" />
                        <span className="sr-only">Zoom in</span>
                    </button>
                    <button
                        type="button"
                        onClick={resetView}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/74 transition hover:bg-white/14 hover:text-white"
                        title="Reset zoom"
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Reset zoom</span>
                    </button>
                </div>
            </div>
            <div className="bccc-street-view-route-controls absolute right-3 bottom-4 left-3 z-20 flex items-center justify-center gap-2 rounded-full border border-white/12 bg-black/44 p-1.5 backdrop-blur-xl sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
                <button
                    type="button"
                    onClick={() => moveToArea(previousArea)}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-black tracking-[0.14em] text-white/70 uppercase transition hover:bg-white/12 hover:text-white sm:flex-none"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {previousArea.shortLabel}
                </button>
                <span className="h-7 w-px bg-white/14" />
                <button
                    type="button"
                    onClick={() => moveToArea(nextArea)}
                    className="inline-flex min-h-10 flex-[1.25] items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-4 text-[10px] font-black tracking-[0.14em] text-[#123f37] uppercase transition hover:bg-white sm:flex-none"
                >
                    Next {nextArea.shortLabel}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function AreaButton({
    area,
    selected,
    onSelect,
    onPreview,
}: {
    area: TourArea;
    selected: boolean;
    onSelect: (area: TourArea) => void;
    onPreview: (area: TourArea) => void;
}) {
    return (
        <div
            className={cx(
                'group flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left transition duration-300',
                selected
                    ? 'border-[#f4dfad]/70 bg-[#f4dfad] text-[#123f37] shadow-[0_18px_44px_rgba(0,0,0,0.22)]'
                    : 'border-white/12 bg-white/8 text-white/74 hover:border-white/28 hover:bg-white/13 hover:text-white',
            )}
        >
            <button
                type="button"
                onClick={() => onSelect(area)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <span
                    className={cx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-md border',
                        selected
                            ? 'border-[#123f37]/15 bg-[#123f37]/10 text-[#123f37]'
                            : 'border-white/12 bg-black/16 text-[#f4dfad]',
                    )}
                >
                    <MapPinned className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-black">
                        {area.shortLabel}
                    </span>
                    <span
                        className={cx(
                            'mt-0.5 block truncate text-[10px] font-bold tracking-[0.12em] uppercase',
                            selected ? 'text-[#123f37]/60' : 'text-white/42',
                        )}
                    >
                        {area.category}
                    </span>
                </span>
            </button>

            <button
                type="button"
                onClick={() => onPreview(area)}
                title={`Open ${area.label} preview`}
                className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full border transition',
                    selected
                        ? 'border-[#123f37]/18 bg-white/28 text-[#123f37] hover:bg-white/48'
                        : 'border-white/12 bg-black/20 text-[#f4dfad] hover:border-[#f4dfad]/46 hover:bg-[#f4dfad] hover:text-[#123f37]',
                )}
            >
                <ScanEye className="h-4 w-4" />
                <span className="sr-only">Open {area.label} preview</span>
            </button>
        </div>
    );
}

function RouteMiniMap({
    activeArea,
    onSelect,
}: {
    activeArea: TourArea;
    onSelect: (area: TourArea) => void;
}) {
    const points = useMemo(() => {
        const xs = VISIT_ROUTE_AREAS.map((area) => area.footprint.x);
        const zs = VISIT_ROUTE_AREAS.map((area) => area.footprint.z);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minZ = Math.min(...zs);
        const maxZ = Math.max(...zs);
        const spanX = Math.max(maxX - minX, 1);
        const spanZ = Math.max(maxZ - minZ, 1);

        return VISIT_ROUTE_AREAS.map((area, index) => ({
            area,
            index,
            left: 10 + ((area.footprint.x - minX) / spanX) * 80,
            top: 14 + ((area.footprint.z - minZ) / spanZ) * 72,
        }));
    }, []);

    const showingOverview = activeArea.id === 'whole-tour';

    return (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/18 p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                    <MapPinned className="h-3.5 w-3.5" />
                    Route minimap
                </div>
                <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-black text-white/56">
                    {VISIT_ROUTE_AREAS.length} stops
                </span>
            </div>

            <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(159,232,220,0.12),rgba(244,223,173,0.08)),rgba(255,255,255,0.04)]">
                <div className="pointer-events-none absolute inset-3 rounded-md border border-white/10" />
                <div className="pointer-events-none absolute inset-x-7 top-1/2 h-px bg-[#f4dfad]/24" />
                <div className="pointer-events-none absolute top-7 bottom-7 left-1/2 w-px bg-[#9fe8dc]/18" />

                {points.map(({ area, index, left, top }) => {
                    const selected =
                        showingOverview || area.id === activeArea.id;

                    return (
                        <button
                            key={`minimap-${area.id}`}
                            type="button"
                            onClick={() => onSelect(area)}
                            title={`View ${area.label}`}
                            aria-pressed={selected}
                            className={cx(
                                'absolute z-10 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] font-black transition duration-300',
                                selected
                                    ? 'border-white bg-[#f4dfad] text-[#123f37] shadow-[0_0_0_5px_rgba(244,223,173,0.18)]'
                                    : 'border-white/24 bg-black/38 text-white/68 hover:border-[#f4dfad] hover:bg-[#f4dfad] hover:text-[#123f37]',
                            )}
                            style={{ left: `${left}%`, top: `${top}%` }}
                        >
                            {index + 1}
                            <span className="sr-only">Select {area.label}</span>
                        </button>
                    );
                })}

                {points.map(({ area, left, top }) => (
                    <span
                        key={`minimap-label-${area.id}`}
                        className={cx(
                            'pointer-events-none absolute hidden -translate-x-1/2 rounded-full border px-2 py-1 text-[9px] font-black tracking-[0.08em] uppercase sm:block',
                            showingOverview || area.id === activeArea.id
                                ? 'border-[#f4dfad]/40 bg-[#f4dfad] text-[#123f37]'
                                : 'border-white/12 bg-black/44 text-white/54',
                        )}
                        style={{
                            left: `${left}%`,
                            top: `calc(${top}% + 1.45rem)`,
                        }}
                    >
                        {area.shortLabel}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function VirtualTourPage() {
    const reduceMotion = useReducedMotion();
    const [activeArea, setActiveArea] = useState<TourArea>(TOUR_AREAS[0]);
    const [previewArea, setPreviewArea] = useState<TourArea | null>(null);
    const {
        isViewerExpanded: isTourViewerExpanded,
        shellRef: tourShellRef,
        toggleFullscreen: toggleTourFullscreen,
    } = useFullscreenViewer();
    const activeIndex = useMemo(
        () => TOUR_AREAS.findIndex((area) => area.id === activeArea.id),
        [activeArea],
    );
    const previousArea =
        TOUR_AREAS[(activeIndex - 1 + TOUR_AREAS.length) % TOUR_AREAS.length];
    const nextArea = TOUR_AREAS[(activeIndex + 1) % TOUR_AREAS.length];
    const openPreview = (area: TourArea) => {
        setActiveArea(area);
        setPreviewArea(area);
    };

    return (
        <PublicLayout>
            <Head title="3D Tour Visit - Coming Soon" />

            <section className="bccc-virtual-tour-page bccc-luxury-preview-page relative min-h-[calc(100svh-var(--bccc-public-header-h))] overflow-hidden bg-[#061514] text-white">
                <div className="bccc-luxury-preview-stage relative z-10 grid min-h-[calc(100svh-var(--bccc-public-header-h))] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,34rem)] lg:px-8 lg:py-10 xl:px-12">
                    <div className="flex min-w-0 flex-col pt-10 pb-2 lg:pt-16 lg:pb-8">
                        <motion.div
                            initial={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : {
                                          opacity: 0,
                                          y: 24,
                                          filter: 'blur(10px)',
                                      }
                            }
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.7, ease }}
                        >
                            <div className="bccc-luxury-preview-kicker">
                                <Sparkles className="h-3.5 w-3.5" />
                                Premium 360 Visit Preview
                            </div>

                            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.6rem)] leading-[0.9] font-semibold tracking-normal text-balance text-white">
                                BCCC virtual walk-through.
                            </h1>

                            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8">
                                A refined coming-soon preview for a future
                                street-view style visit of the Baguio Convention
                                and Cultural Center, from exterior arrival to
                                the main hall and support areas.
                            </p>

                            <div className="bccc-luxury-preview-stats mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                                <div>
                                    <strong>{TOUR_AREAS.length}</strong>
                                    <span>planned areas</span>
                                </div>
                                <div>
                                    <strong>360</strong>
                                    <span>view movement</span>
                                </div>
                                <div>
                                    <strong>1</strong>
                                    <span>guided public route</span>
                                </div>
                            </div>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/facilities"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#123f37] uppercase transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                    View Facilities
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/convention-layout"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#f4dfad]/26 bg-[#f4dfad]/10 px-5 text-[11px] font-black tracking-[0.14em] text-[#f4dfad] uppercase backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[#f4dfad] hover:text-[#123f37]"
                                >
                                    3D Layout
                                    <LayoutDashboard className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-white/9 px-5 text-[11px] font-black tracking-[0.14em] text-white uppercase backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15"
                                >
                                    Ask the Office
                                    <Navigation className="h-4 w-4" />
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            ref={tourShellRef}
                            initial={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : {
                                          opacity: 0,
                                          y: 20,
                                          filter: 'blur(10px)',
                                      }
                            }
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.74, delay: 0.12, ease }}
                            className={cx(
                                'bccc-windowed-tour-shell relative mt-7 overflow-hidden rounded-xl border border-white/14 bg-black/28 shadow-[0_34px_110px_rgba(0,0,0,0.42)]',
                                isTourViewerExpanded && 'is-viewer-expanded',
                            )}
                        >
                            <TourScene
                                activeArea={activeArea}
                                nextArea={nextArea}
                                previousArea={previousArea}
                                onMoveToArea={setActiveArea}
                            />
                            <button
                                type="button"
                                onClick={toggleTourFullscreen}
                                aria-pressed={isTourViewerExpanded}
                                className="bccc-viewer-fullscreen-button absolute top-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/14 bg-black/46 text-white/78 backdrop-blur-xl transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#123f37]"
                                title={
                                    isTourViewerExpanded
                                        ? 'Exit fullscreen'
                                        : 'Open fullscreen'
                                }
                            >
                                {isTourViewerExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {isTourViewerExpanded
                                        ? 'Exit fullscreen'
                                        : 'Open fullscreen'}
                                </span>
                            </button>
                        </motion.div>
                    </div>

                    <motion.aside
                        initial={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 0, x: 24, filter: 'blur(10px)' }
                        }
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.68, delay: 0.08, ease }}
                        className="bccc-luxury-preview-panel self-end rounded-xl border border-white/12 bg-black/26 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:self-center"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.2em] text-[#f4dfad] uppercase">
                                    Selected tour node
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                                    {activeArea.label}
                                </h2>
                            </div>
                            <span className="rounded-full border border-[#f4dfad]/28 bg-[#f4dfad]/12 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-[#f4dfad] uppercase">
                                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                                {String(TOUR_AREAS.length).padStart(2, '0')}
                            </span>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-white/66">
                            {activeArea.description}
                        </p>

                        <div className="mt-4 rounded-lg border border-white/10 bg-white/8 p-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black tracking-[0.16em] text-white/48 uppercase">
                                    Area readiness
                                </span>
                                <span className="rounded-full bg-[#f4dfad] px-2.5 py-1 text-[10px] font-black text-[#123f37]">
                                    {activeArea.preview.readiness}%
                                </span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#9fe8dc,#f4dfad)]"
                                    style={{
                                        width: `${activeArea.preview.readiness}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <RouteMiniMap
                            activeArea={activeArea}
                            onSelect={setActiveArea}
                        />

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveArea(previousArea)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 text-[10px] font-black tracking-[0.12em] text-white/72 uppercase transition hover:border-white/28 hover:bg-white/12 hover:text-white"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                {previousArea.shortLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveArea(nextArea)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#f4dfad]/28 bg-[#f4dfad]/12 px-3 text-[10px] font-black tracking-[0.12em] text-[#f4dfad] uppercase transition hover:bg-[#f4dfad] hover:text-[#123f37]"
                            >
                                {nextArea.shortLabel}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-lg border border-white/10 bg-white/8 p-3">
                            <p className="flex items-center gap-2 text-xs leading-6 font-semibold text-white/72">
                                <Camera className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                                {activeArea.captureNote}
                            </p>
                        </div>

                        <div className="mt-4 rounded-lg border border-white/10 bg-black/16 p-3">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                                <Route className="h-3.5 w-3.5" />
                                Suggested hotspots
                            </div>
                            <div className="mt-3 grid gap-2">
                                {activeArea.preview.routeNodes.map(
                                    (node, index) => (
                                        <div
                                            key={`${activeArea.id}-${node}`}
                                            className="flex items-start gap-2 text-xs leading-5 font-semibold text-white/62"
                                        >
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f4dfad] text-[9px] font-black text-[#123f37]">
                                                {index + 1}
                                            </span>
                                            <span>{node}</span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => openPreview(activeArea)}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#123f37] uppercase transition hover:bg-white"
                        >
                            Open Area Preview
                            <ScanEye className="h-4 w-4" />
                        </button>

                        <div className="mt-5 grid max-h-[22rem] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:max-h-[30rem] sm:grid-cols-2 lg:max-h-[42vh] lg:grid-cols-1">
                            {TOUR_AREAS.map((area) => (
                                <AreaButton
                                    key={area.id}
                                    area={area}
                                    selected={area.id === activeArea.id}
                                    onSelect={setActiveArea}
                                    onPreview={openPreview}
                                />
                            ))}
                        </div>
                    </motion.aside>
                </div>
            </section>

            <section className="bg-[#edf2f1] px-4 py-12 text-[#143f38] sm:px-6 lg:px-8 dark:bg-[#081311] dark:text-white">
                <div className="mx-auto max-w-[1480px]">
                    <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#176456]/18 bg-white/70 px-4 py-2 text-[10px] font-black tracking-[0.18em] text-[#176456] uppercase dark:border-white/10 dark:bg-white/8 dark:text-[#9fe8dc]">
                                <Map className="h-3.5 w-3.5" />
                                One-page route
                            </div>
                            <h2 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold text-[#143f38] sm:text-5xl dark:text-white">
                                Planned tour areas in one guided public display.
                            </h2>
                        </div>

                        <p className="max-w-3xl text-sm leading-7 text-[#53645f] dark:text-white/64">
                            The final feature is planned to work like a public
                            street-view style visit: choose an area, move the
                            view around, then continue to another connected
                            point without leaving the page.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-xl border border-[#176456]/14 bg-white p-5 shadow-[0_18px_50px_rgba(14,60,52,0.08)] dark:border-white/10 dark:bg-white/[0.055]">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#176456] px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-white uppercase dark:bg-[#9fe8dc] dark:text-[#081311]">
                                <Compass className="h-3.5 w-3.5" />
                                Street-view behavior
                            </div>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {TOUR_STREET_VIEW_GUIDANCE.map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-lg border border-[#176456]/12 bg-[#edf2f1] p-4 dark:border-white/10 dark:bg-white/[0.055]"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-[#176456] dark:text-[#9fe8dc]" />
                                        <h3 className="mt-3 text-sm font-black text-[#143f38] dark:text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-6 font-semibold text-[#53645f] dark:text-white/58">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#176456]/14 bg-[#143f38] p-5 text-white shadow-[0_18px_50px_rgba(14,60,52,0.12)] dark:border-white/10 dark:bg-white/[0.055]">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#f4dfad] px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-[#123f37] uppercase">
                                <FileImage className="h-3.5 w-3.5" />
                                Media upload standard
                            </div>
                            <div className="mt-5 grid gap-3">
                                {TOUR_MEDIA_SPECS.map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-lg border border-white/10 bg-white/[0.07] p-4"
                                    >
                                        <h3 className="text-sm font-black text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-6 font-semibold text-white/62">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {TOUR_AREAS.map((area, index) => (
                            <article
                                key={`tour-card-${area.id}`}
                                className="group overflow-hidden rounded-xl border border-[#176456]/14 bg-white shadow-[0_18px_50px_rgba(14,60,52,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(14,60,52,0.13)] dark:border-white/10 dark:bg-white/[0.055]"
                            >
                                <div className="relative aspect-[16/9] overflow-hidden bg-[#061514]">
                                    <img
                                        src={area.image}
                                        alt={area.label}
                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/14 to-transparent" />
                                    <span className="absolute top-3 left-3 rounded-full bg-[#f4dfad] px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-[#123f37] uppercase">
                                        Soon
                                    </span>
                                    <span className="absolute right-3 bottom-3 rounded-full border border-white/18 bg-black/34 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-white uppercase backdrop-blur">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <p className="text-[10px] font-black tracking-[0.18em] text-[#9d7432] uppercase dark:text-[#f1d89b]">
                                        {area.category}
                                    </p>
                                    <h3 className="mt-2 text-xl font-semibold text-[#143f38] dark:text-white">
                                        {area.label}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-[#53645f] dark:text-white/62">
                                        {area.description}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => openPreview(area)}
                                        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#176456]/18 bg-[#edf2f1] px-4 text-[10px] font-black tracking-[0.14em] text-[#176456] uppercase transition hover:border-[#176456] hover:bg-[#176456] hover:text-white dark:border-white/12 dark:bg-white/8 dark:text-[#9fe8dc] dark:hover:border-[#9fe8dc] dark:hover:bg-[#9fe8dc] dark:hover:text-[#081311]"
                                    >
                                        Preview popup
                                        <ScanEye className="h-4 w-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#f8f5ef] px-4 py-12 text-[#143f38] sm:px-6 lg:px-8 dark:bg-[#0d0f12] dark:text-white">
                <div className="mx-auto grid max-w-[1480px] gap-5 rounded-xl border border-[#176456]/14 bg-white/80 p-5 shadow-[0_18px_60px_rgba(14,60,52,0.07)] sm:p-6 lg:grid-cols-[0.7fr_1.3fr] lg:p-8 dark:border-white/10 dark:bg-white/[0.055]">
                    <div>
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#176456] text-white dark:bg-[#9fe8dc] dark:text-[#081311]">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold text-[#143f38] dark:text-white">
                            Launch preparation
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-[#53645f] dark:text-white/62">
                            These steps keep the future 3D tour realistic,
                            accurate, and safe for public viewing.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {TOUR_LAUNCH_STEPS.map((step) => (
                                <div
                                    key={step}
                                    className="flex items-start gap-3 rounded-lg border border-[#176456]/12 bg-[#edf2f1] p-4 dark:border-white/10 dark:bg-white/[0.055]"
                                >
                                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#176456] dark:text-[#9fe8dc]" />
                                    <p className="text-sm leading-7 font-semibold text-[#143f38] dark:text-white/72">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {TOUR_RELEASE_CHECKLIST.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-lg border border-[#176456]/12 bg-white p-4 dark:border-white/10 dark:bg-black/18"
                                >
                                    <h3 className="text-sm font-black text-[#143f38] dark:text-white">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-6 font-semibold text-[#53645f] dark:text-white/58">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#061514] px-4 py-12 text-white sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-[1480px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.22em] text-[#f4dfad] uppercase">
                            BCCC EASE public display
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold">
                            Need to inspect the real areas now?
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/facilities"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#123f37] uppercase transition hover:bg-white"
                        >
                            Facilities
                            <Building2 className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/calendar"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-5 text-[11px] font-black tracking-[0.14em] text-white uppercase transition hover:bg-white/14"
                        >
                            Public Calendar
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/convention-layout"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#f4dfad]/28 bg-[#f4dfad]/10 px-5 text-[11px] font-black tracking-[0.14em] text-[#f4dfad] uppercase transition hover:bg-[#f4dfad] hover:text-[#123f37]"
                        >
                            3D Layout
                            <LayoutDashboard className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <TourAreaPreviewDialog
                area={previewArea}
                open={Boolean(previewArea)}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewArea(null);
                    }
                }}
            />
        </PublicLayout>
    );
}

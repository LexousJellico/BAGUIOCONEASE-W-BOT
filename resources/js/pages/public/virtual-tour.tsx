import TourAreaPreviewDialog from '@/components/public/tour-area-preview-dialog';
import {
    TOUR_AREA_MAPS,
    TOUR_AREAS,
    TOUR_LAUNCH_STEPS,
    TOUR_MEDIA_SPECS,
    TOUR_RELEASE_CHECKLIST,
    TOUR_STREET_VIEW_GUIDANCE,
    type TourArea,
    type TourAreaMap,
} from '@/data/bccc-tour-areas';
import PublicLayout from '@/layouts/public-layout';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarDays,
    Camera,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Compass,
    FileImage,
    LayoutDashboard,
    LocateFixed,
    Map,
    MapPinned,
    Maximize2,
    Minimize2,
    Navigation,
    Route,
    ScanEye,
    Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

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

function PanoramaViewer({
    image,
    fallbackImage,
    label,
    loading,
    onReady,
    onFailure,
}: {
    image: string;
    fallbackImage: string;
    label: string;
    loading: boolean;
    onReady: () => void;
    onFailure: () => void;
}) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
    const viewRef = useRef({ latitude: 0, longitude: 0 });

    useEffect(() => {
        const mount = mountRef.current;

        if (!mount) {
            return;
        }

        let animationFrame = 0;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 1100);
        let renderer: THREE.WebGLRenderer;

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance',
            });
        } catch {
            onFailure();
            return;
        }

        const geometry = new THREE.SphereGeometry(500, 64, 40);
        const material = new THREE.MeshBasicMaterial({ color: 0x081b19 });
        const sphere = new THREE.Mesh(geometry, material);
        const target = new THREE.Vector3();
        const drag = {
            active: false,
            pointerId: -1,
            x: 0,
            y: 0,
            latitude: 0,
            longitude: 0,
        };

        geometry.scale(-1, 1, 1);
        scene.add(sphere);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x061514);
        renderer.domElement.setAttribute('aria-label', 'Virtual tour panorama');
        renderer.domElement.setAttribute('role', 'img');
        mount.appendChild(renderer.domElement);
        materialRef.current = material;

        const resize = () => {
            const width = Math.max(mount.clientWidth, 1);
            const height = Math.max(mount.clientHeight, 1);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };

        const render = () => {
            const latitude = Math.max(
                -78,
                Math.min(78, viewRef.current.latitude),
            );
            const phi = THREE.MathUtils.degToRad(90 - latitude);
            const theta = THREE.MathUtils.degToRad(viewRef.current.longitude);

            target.set(
                500 * Math.sin(phi) * Math.cos(theta),
                500 * Math.cos(phi),
                500 * Math.sin(phi) * Math.sin(theta),
            );
            camera.lookAt(target);
            renderer.render(scene, camera);
            animationFrame = window.requestAnimationFrame(render);
        };

        const handlePointerDown = (event: PointerEvent) => {
            drag.active = true;
            drag.pointerId = event.pointerId;
            drag.x = event.clientX;
            drag.y = event.clientY;
            drag.latitude = viewRef.current.latitude;
            drag.longitude = viewRef.current.longitude;
            renderer.domElement.setPointerCapture(event.pointerId);
            renderer.domElement.dataset.dragging = 'true';
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (!drag.active || event.pointerId !== drag.pointerId) {
                return;
            }

            viewRef.current.longitude =
                drag.longitude - (event.clientX - drag.x) * 0.14;
            viewRef.current.latitude =
                drag.latitude + (event.clientY - drag.y) * 0.12;
        };

        const endPointerDrag = (event: PointerEvent) => {
            if (event.pointerId !== drag.pointerId) {
                return;
            }

            drag.active = false;
            drag.pointerId = -1;
            delete renderer.domElement.dataset.dragging;
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            camera.fov = Math.max(
                44,
                Math.min(88, camera.fov + event.deltaY * 0.035),
            );
            camera.updateProjectionMatrix();
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        renderer.domElement.addEventListener('pointerdown', handlePointerDown);
        renderer.domElement.addEventListener('pointermove', handlePointerMove);
        renderer.domElement.addEventListener('pointerup', endPointerDrag);
        renderer.domElement.addEventListener('pointercancel', endPointerDrag);
        renderer.domElement.addEventListener('wheel', handleWheel, {
            passive: false,
        });
        resize();
        render();

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener(
                'pointerdown',
                handlePointerDown,
            );
            renderer.domElement.removeEventListener(
                'pointermove',
                handlePointerMove,
            );
            renderer.domElement.removeEventListener(
                'pointerup',
                endPointerDrag,
            );
            renderer.domElement.removeEventListener(
                'pointercancel',
                endPointerDrag,
            );
            renderer.domElement.removeEventListener('wheel', handleWheel);
            material.map?.dispose();
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            materialRef.current = null;
        };
    }, [onFailure]);

    useEffect(() => {
        const canvas = mountRef.current?.querySelector('canvas');
        canvas?.setAttribute('aria-label', `${label} panorama`);
    }, [label]);

    useEffect(() => {
        const material = materialRef.current;

        if (!material) {
            return;
        }

        let cancelled = false;
        const loader = new THREE.TextureLoader();
        const loadTexture = (source: string, isFallback = false) => {
            loader.load(
                source,
                (texture) => {
                    if (cancelled) {
                        texture.dispose();
                        return;
                    }

                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.anisotropy = 4;
                    material.map?.dispose();
                    material.map = texture;
                    material.color.setHex(0xffffff);
                    material.needsUpdate = true;
                    onReady();
                },
                undefined,
                () => {
                    if (!isFallback && source !== fallbackImage) {
                        loadTexture(fallbackImage, true);
                        return;
                    }

                    onFailure();
                },
            );
        };

        loadTexture(image);

        return () => {
            cancelled = true;
        };
    }, [fallbackImage, image, onFailure, onReady]);

    return (
        <div
            ref={mountRef}
            className={cx(
                'bccc-tour-panorama absolute inset-0',
                loading && 'is-loading',
            )}
        />
    );
}

function TourScene({
    activeArea,
    activeStopIndex,
    onMoveToStop,
}: {
    activeArea: TourArea;
    activeStopIndex: number;
    onMoveToStop: (index: number) => void;
}) {
    const reduceMotion = Boolean(useReducedMotion());
    const [panoramaReady, setPanoramaReady] = useState(false);
    const [panoramaFailed, setPanoramaFailed] = useState(false);
    const [moveDirection, setMoveDirection] = useState(1);
    const stopIndex = Math.min(
        Math.max(activeStopIndex, 0),
        activeArea.scenes.length - 1,
    );
    const activeStop = activeArea.scenes[stopIndex];
    const connections = activeStop.connections ?? [];
    const backwardConnection = connections.find(
        (connection) => connection.kind === 'backward',
    );
    const forwardConnection = connections.find(
        (connection) => connection.kind === 'forward',
    );
    const choiceConnections = connections.filter(
        (connection) => connection.kind === 'choice',
    );

    const moveToStop = useCallback(
        (index: number, direction?: 'backward' | 'forward' | 'choice') => {
            const nextIndex = Math.min(
                Math.max(index, 0),
                activeArea.scenes.length - 1,
            );

            if (nextIndex !== stopIndex) {
                setMoveDirection(
                    direction === 'backward'
                        ? -1
                        : direction === 'forward' || direction === 'choice'
                          ? 1
                          : nextIndex > stopIndex
                            ? 1
                            : -1,
                );
                setPanoramaReady(false);
                setPanoramaFailed(false);
                onMoveToStop(nextIndex);
            }
        },
        [activeArea.scenes.length, onMoveToStop, stopIndex],
    );

    const moveThroughConnection = useCallback(
        (connection: (typeof connections)[number] | undefined) => {
            if (!connection) {
                return;
            }

            const nextIndex = activeArea.scenes.findIndex(
                (scene) => scene.id === connection.targetId,
            );

            if (nextIndex >= 0) {
                moveToStop(nextIndex, connection.kind);
            }
        },
        [activeArea.scenes, moveToStop],
    );

    const handlePanoramaReady = useCallback(() => {
        setPanoramaReady(true);
        setPanoramaFailed(false);
    }, []);
    const handlePanoramaFailure = useCallback(() => {
        setPanoramaFailed(true);
    }, []);

    useEffect(() => {
        setPanoramaReady(false);
        setPanoramaFailed(false);
    }, [activeArea.id, activeStop.id]);

    useEffect(() => {
        activeArea.scenes.forEach((scene) => {
            const image = new Image();
            image.src = scene.image;
        });
    }, [activeArea]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveThroughConnection(backwardConnection);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveThroughConnection(forwardConnection);
        }

        if (event.key === 'Home') {
            event.preventDefault();
            moveToStop(0, 'backward');
        }

        const choiceNumber = Number(event.key);
        if (
            Number.isInteger(choiceNumber) &&
            choiceNumber >= 1 &&
            choiceNumber <= choiceConnections.length
        ) {
            event.preventDefault();
            moveThroughConnection(choiceConnections[choiceNumber - 1]);
        }
    };

    return (
        <div
            className="bccc-virtual-tour-viewport absolute inset-0 overflow-hidden bg-[#061514] outline-none"
            role="region"
            aria-label={`${activeArea.label} immersive 360 virtual walk-through`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <PanoramaViewer
                image={activeStop.image}
                fallbackImage={activeArea.image}
                label={`${activeArea.label}: ${activeStop.label}`}
                loading={!panoramaReady}
                onReady={handlePanoramaReady}
                onFailure={handlePanoramaFailure}
            />

            <AnimatePresence initial={false}>
                {!panoramaReady || panoramaFailed ? (
                    <motion.img
                        key={activeStop.id}
                        src={activeStop.image}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
                        draggable={false}
                        initial={
                            reduceMotion
                                ? { opacity: 1 }
                                : {
                                      opacity: 1,
                                      scale: moveDirection > 0 ? 1.08 : 0.94,
                                      filter: 'blur(18px)',
                                  }
                        }
                        animate={{
                            opacity: panoramaFailed ? 1 : 0.84,
                            scale: 1.02,
                            filter: panoramaFailed ? 'blur(0px)' : 'blur(8px)',
                        }}
                        exit={
                            reduceMotion
                                ? { opacity: 0 }
                                : {
                                      opacity: 0,
                                      scale: moveDirection > 0 ? 1.15 : 0.88,
                                      filter: 'blur(24px)',
                                  }
                        }
                        transition={{
                            duration: reduceMotion ? 0.1 : 0.68,
                            ease,
                        }}
                    />
                ) : null}
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.5),transparent_36%,transparent_68%,rgba(0,0,0,0.38))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute top-4 left-4 max-w-[calc(100%-9rem)] rounded-lg border border-white/14 bg-black/38 px-3 py-2 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                    <LocateFixed className="h-3.5 w-3.5" />
                    {activeArea.shortLabel}
                </div>
                <p className="mt-1 truncate text-xs font-bold text-white/80">
                    {activeStop.label} · View {stopIndex + 1} of{' '}
                    {activeArea.scenes.length}
                </p>
            </div>

            <div className="bccc-tour-look-hint pointer-events-none absolute top-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/34 px-3 py-2 text-[9px] font-black tracking-[0.14em] text-white/68 uppercase backdrop-blur-xl sm:flex">
                <Compass className="h-3.5 w-3.5 text-[#f4dfad]" />
                Drag to look around
            </div>

            {choiceConnections.length > 0 ? (
                <div className="bccc-street-view-route-controls bccc-street-view-route-choices absolute right-3 bottom-4 left-3 z-20 mx-auto max-w-4xl rounded-xl border border-white/12 bg-black/64 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between gap-3 px-2 py-1">
                        <span className="text-[9px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                            Choose your next hall view
                        </span>
                        <span className="hidden text-[8px] font-bold tracking-[0.1em] text-white/42 uppercase sm:block">
                            Ground Hall navigation hub
                        </span>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {choiceConnections.map((connection, index) => (
                            <button
                                key={connection.targetId}
                                type="button"
                                onClick={() =>
                                    moveThroughConnection(connection)
                                }
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#f4dfad]/22 bg-[#f4dfad]/12 px-3 text-[9px] font-black tracking-[0.12em] text-[#f4dfad] uppercase transition hover:border-[#f4dfad] hover:bg-[#f4dfad] hover:text-[#123f37]"
                            >
                                <Navigation className="h-3.5 w-3.5" />
                                {connection.label}
                                <span className="sr-only">
                                    Keyboard shortcut {index + 1}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bccc-street-view-route-controls absolute right-3 bottom-4 left-3 z-20 mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-white/12 bg-black/58 p-2 shadow-[0_20px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                    <button
                        type="button"
                        onClick={() =>
                            moveThroughConnection(backwardConnection)
                        }
                        disabled={!backwardConnection}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 text-center text-[9px] font-black tracking-[0.12em] text-white/78 uppercase transition hover:border-white/24 hover:bg-white/14 hover:text-white disabled:cursor-not-allowed disabled:opacity-28 sm:text-[10px]"
                    >
                        <ChevronLeft className="h-4 w-4 shrink-0" />
                        <span>
                            Move backward
                            {backwardConnection ? (
                                <small className="mt-0.5 block text-[8px] tracking-[0.08em] text-white/45">
                                    {backwardConnection.label}
                                </small>
                            ) : null}
                        </span>
                    </button>
                    <div className="pointer-events-none flex min-w-20 flex-col items-center justify-center px-1 text-center sm:min-w-24 sm:px-2">
                        <span className="text-[9px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                            {String(stopIndex + 1).padStart(2, '0')} /{' '}
                            {String(activeArea.scenes.length).padStart(2, '0')}
                        </span>
                        <span className="mt-1 hidden text-[8px] font-bold tracking-[0.1em] text-white/42 uppercase sm:block">
                            Look around freely
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => moveThroughConnection(forwardConnection)}
                        disabled={!forwardConnection}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#f4dfad] px-3 text-center text-[9px] font-black tracking-[0.12em] text-[#123f37] uppercase transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:text-[10px]"
                    >
                        <span>
                            Move forward
                            {forwardConnection ? (
                                <small className="mt-0.5 block text-[8px] tracking-[0.08em] text-[#123f37]/55">
                                    {forwardConnection.label}
                                </small>
                            ) : null}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                </div>
            )}
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

function AreaFloorMap({
    activeArea,
    activeStopIndex,
    onMoveToStop,
    onSelectArea,
}: {
    activeArea: TourArea;
    activeStopIndex: number;
    onMoveToStop: (index: number) => void;
    onSelectArea: (area: TourArea) => void;
}) {
    const areaMap: TourAreaMap = TOUR_AREA_MAPS[activeArea.id];
    const activeStop =
        activeArea.scenes[activeStopIndex] ?? activeArea.scenes[0];
    const nodeLookup = useMemo(
        () =>
            new globalThis.Map(
                areaMap.nodes.map((node) => [node.sceneId, node] as const),
            ),
        [areaMap.nodes],
    );
    const connectionLines = useMemo(() => {
        const seen = new Set<string>();

        return activeArea.scenes.flatMap((scene) => {
            const start = nodeLookup.get(scene.id);

            if (!start) {
                return [];
            }

            return (scene.connections ?? []).flatMap((connection) => {
                const end = nodeLookup.get(connection.targetId);
                const key = [scene.id, connection.targetId].sort().join(':');

                if (!end || seen.has(key)) {
                    return [];
                }

                seen.add(key);

                return [{ key, start, end }];
            });
        });
    }, [activeArea.scenes, nodeLookup]);

    const moveToScene = (sceneId: string) => {
        const nextIndex = activeArea.scenes.findIndex(
            (scene) => scene.id === sceneId,
        );

        if (nextIndex >= 0) {
            onMoveToStop(nextIndex);
        }
    };

    const selectSurroundingArea = (areaId: string | undefined) => {
        const area = TOUR_AREAS.find((candidate) => candidate.id === areaId);

        if (area) {
            onSelectArea(area);
        }
    };

    return (
        <aside className="bccc-live-tour-map flex min-h-0 flex-col overflow-hidden border border-white/10 bg-[#0b1c19] text-white shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                            <Map className="h-3.5 w-3.5" />
                            Live area map
                        </div>
                        <h2 className="mt-2 truncate text-xl font-semibold text-white">
                            {areaMap.title}
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-white/48">
                            {areaMap.subtitle}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#f4dfad]/24 bg-[#f4dfad]/10 px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-[#f4dfad] uppercase">
                        {areaMap.level}
                    </span>
                </div>
            </div>

            <div className="min-h-0 flex-1 p-3 sm:p-4">
                <div className="bccc-area-map-canvas relative h-full min-h-[15rem] overflow-hidden rounded-xl border border-white/12 bg-[#dfe9e5]">
                    {areaMap.backgroundImage ? (
                        <img
                            src={areaMap.backgroundImage}
                            alt={`${activeArea.label} location map`}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <svg
                            viewBox="0 0 100 100"
                            className="absolute inset-0 h-full w-full"
                            aria-label={`${activeArea.label} floor layout`}
                            role="img"
                        >
                            <defs>
                                <pattern
                                    id={`grid-${activeArea.id}`}
                                    width="5"
                                    height="5"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 5 0 L 0 0 0 5"
                                        fill="none"
                                        stroke="rgba(20,63,56,0.08)"
                                        strokeWidth="0.35"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100" height="100" fill="#e9f0ed" />
                            <rect
                                width="100"
                                height="100"
                                fill={`url(#grid-${activeArea.id})`}
                            />

                            {areaMap.rooms.map((room) => (
                                <g
                                    key={room.id}
                                    role={room.areaId ? 'button' : undefined}
                                    tabIndex={room.areaId ? 0 : undefined}
                                    className={cx(
                                        'bccc-map-room',
                                        room.kind === 'active' &&
                                            'is-active-room',
                                        room.kind === 'surrounding' &&
                                            'is-surrounding-room',
                                        room.kind === 'feature' &&
                                            'is-feature-room',
                                        room.areaId && 'is-clickable-room',
                                    )}
                                    onClick={() =>
                                        selectSurroundingArea(room.areaId)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            room.areaId &&
                                            (event.key === 'Enter' ||
                                                event.key === ' ')
                                        ) {
                                            event.preventDefault();
                                            selectSurroundingArea(room.areaId);
                                        }
                                    }}
                                >
                                    <rect
                                        x={room.x}
                                        y={room.y}
                                        width={room.width}
                                        height={room.height}
                                        rx="1.4"
                                    />
                                    <text
                                        x={room.x + room.width / 2}
                                        y={room.y + room.height / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {room.label}
                                    </text>
                                </g>
                            ))}

                            {connectionLines.map(({ key, start, end }) => (
                                <line
                                    key={key}
                                    x1={start.x}
                                    y1={start.y}
                                    x2={end.x}
                                    y2={end.y}
                                    className="bccc-map-route-line"
                                />
                            ))}
                        </svg>
                    )}

                    {areaMap.backgroundImage ? (
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,21,20,0.04),rgba(6,21,20,0.22))]" />
                    ) : null}

                    {areaMap.nodes.map((node, index) => {
                        const scene = activeArea.scenes.find(
                            (candidate) => candidate.id === node.sceneId,
                        );
                        const selected = scene?.id === activeStop.id;

                        return (
                            <button
                                key={node.sceneId}
                                type="button"
                                onClick={() => moveToScene(node.sceneId)}
                                aria-pressed={selected}
                                title={scene?.label}
                                className={cx(
                                    'bccc-map-camera-node absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] font-black transition',
                                    selected
                                        ? 'is-current border-white bg-[#176456] text-white'
                                        : 'border-white/80 bg-white text-[#176456] hover:border-[#176456] hover:bg-[#f4dfad]',
                                )}
                                style={{
                                    left: `${node.x}%`,
                                    top: `${node.y}%`,
                                }}
                            >
                                {index + 1}
                                <span className="sr-only">
                                    Open {scene?.label}
                                </span>
                            </button>
                        );
                    })}

                    <div className="absolute top-3 right-3 rounded-lg border border-[#143f38]/12 bg-white/88 px-3 py-2 text-[9px] font-black tracking-[0.12em] text-[#143f38] uppercase shadow-lg backdrop-blur">
                        <span className="flex items-center gap-1.5">
                            <Navigation className="h-3 w-3" />
                            North
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5">
                    <div className="min-w-0">
                        <p className="text-[8px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                            You are here
                        </p>
                        <p className="mt-1 truncate text-xs font-black text-white">
                            {activeArea.label} · {activeStop.label}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#f4dfad] px-2.5 py-1 text-[9px] font-black text-[#123f37]">
                        {activeStopIndex + 1}/{activeArea.scenes.length}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[8px] font-black tracking-[0.13em] text-white/42 uppercase">
                    <Route className="h-3.5 w-3.5 text-[#9fe8dc]" />
                    Select an area or click a map camera
                </div>
                <div className="mt-2 grid max-h-28 grid-cols-3 gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {TOUR_AREAS.map((area) => (
                        <button
                            key={`map-area-${area.id}`}
                            type="button"
                            onClick={() => onSelectArea(area)}
                            aria-pressed={area.id === activeArea.id}
                            className={cx(
                                'min-h-9 truncate rounded-md border px-2 text-[8px] font-black tracking-[0.08em] uppercase transition',
                                area.id === activeArea.id
                                    ? 'border-[#f4dfad] bg-[#f4dfad] text-[#123f37]'
                                    : 'border-white/10 bg-white/[0.05] text-white/58 hover:border-white/24 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            {area.shortLabel}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}

export default function VirtualTourPage() {
    const reduceMotion = useReducedMotion();
    const [activeArea, setActiveArea] = useState<TourArea>(TOUR_AREAS[0]);
    const [activeStopIndex, setActiveStopIndex] = useState(0);
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
    const selectArea = useCallback((area: TourArea) => {
        setActiveArea(area);
        setActiveStopIndex(0);
    }, []);
    const openPreview = (area: TourArea) => {
        selectArea(area);
        setPreviewArea(area);
    };

    if (TOUR_AREA_MAPS[activeArea.id]) {
        return (
            <PublicLayout>
                <Head title="Virtual Tour" />

                <section className="bccc-virtual-tour-page bccc-focused-tour-page bg-[#061514] text-white">
                    <div className="bccc-focused-tour-workspace grid gap-3 p-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(21rem,0.75fr)] lg:gap-4 lg:p-4">
                        <motion.div
                            ref={tourShellRef}
                            initial={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : {
                                          opacity: 0,
                                          scale: 0.99,
                                          filter: 'blur(8px)',
                                      }
                            }
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: 'blur(0px)',
                            }}
                            transition={{ duration: 0.62, ease }}
                            className={cx(
                                'bccc-windowed-tour-shell bccc-focused-tour-view relative min-h-0 overflow-hidden rounded-xl border border-white/12 bg-black/30 shadow-[0_26px_90px_rgba(0,0,0,0.38)]',
                                isTourViewerExpanded && 'is-viewer-expanded',
                            )}
                        >
                            <TourScene
                                activeArea={activeArea}
                                activeStopIndex={activeStopIndex}
                                onMoveToStop={setActiveStopIndex}
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

                        <motion.div
                            initial={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : {
                                          opacity: 0,
                                          x: 16,
                                          filter: 'blur(8px)',
                                      }
                            }
                            animate={{
                                opacity: 1,
                                x: 0,
                                filter: 'blur(0px)',
                            }}
                            transition={{ duration: 0.62, delay: 0.08, ease }}
                            className="min-h-0"
                        >
                            <AreaFloorMap
                                activeArea={activeArea}
                                activeStopIndex={activeStopIndex}
                                onMoveToStop={setActiveStopIndex}
                                onSelectArea={selectArea}
                            />
                        </motion.div>
                    </div>
                </section>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title="Virtual Tour" />

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
                                Interactive Venue Walk-Through
                            </div>

                            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.6rem)] leading-[0.9] font-semibold tracking-normal text-balance text-white">
                                BCCC virtual walk-through.
                            </h1>

                            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8">
                                Explore the Baguio Convention and Cultural
                                Center through connected panorama stops. Move
                                forward or backward inside each area, then
                                choose another destination from the route.
                            </p>

                            <div className="bccc-luxury-preview-stats mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                                <div>
                                    <strong>{TOUR_AREAS.length}</strong>
                                    <span>tour areas</span>
                                </div>
                                <div>
                                    <strong>7</strong>
                                    <span>hall perspectives</span>
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
                                activeStopIndex={activeStopIndex}
                                onMoveToStop={setActiveStopIndex}
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
                            onSelect={selectArea}
                        />

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => selectArea(previousArea)}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 text-[10px] font-black tracking-[0.12em] text-white/72 uppercase transition hover:border-white/28 hover:bg-white/12 hover:text-white"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                {previousArea.shortLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => selectArea(nextArea)}
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
                                    onSelect={selectArea}
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
                                Every destination in one guided public route.
                            </h2>
                        </div>

                        <p className="max-w-3xl text-sm leading-7 text-[#53645f] dark:text-white/64">
                            Choose an area, look around each immersive panorama,
                            and continue through connected route points without
                            leaving the page. Main Hall begins with four
                            directional choices at Ground Hall; other views use
                            the bottom move backward and move forward controls.
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
                                        {area.scenes.length} Views
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
                            These steps keep every connected photo route
                            realistic, accurate, and safe for public viewing.
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

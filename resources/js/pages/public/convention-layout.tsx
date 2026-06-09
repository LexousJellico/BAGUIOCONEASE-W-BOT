import TourAreaPreviewDialog from '@/components/public/tour-area-preview-dialog';
import {
    LAYOUT_IMPLEMENTATION_SUGGESTIONS,
    LAYOUT_VIEW_GUIDANCE,
    TOUR_AREAS,
    TOUR_LAUNCH_STEPS,
    TOUR_RELEASE_CHECKLIST,
    type TourArea,
} from '@/data/bccc-tour-areas';
import PublicLayout from '@/layouts/public-layout';
import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BadgeCheck,
    Building2,
    Eye,
    Layers3,
    LayoutDashboard,
    MapPinned,
    Maximize2,
    Minimize2,
    Minus,
    Plus,
    RotateCcw,
    Route,
    Ruler,
    ScanEye,
    Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ThreeRenderer = import('three').WebGLRenderer;
type ThreeScene = import('three').Scene;
type ThreeCamera = import('three').PerspectiveCamera;
type ThreeGroup = import('three').Group;
type ThreeMaterial = import('three').Material;
type ThreeGeometry = import('three').BufferGeometry;
type ThreeTexture = import('three').Texture;

type LayoutViewMode = 'exterior' | 'interior';
type LayoutSceneCommand =
    | {
          type: 'rotate';
          amount: number;
      }
    | {
          type: 'tilt';
          amount: number;
      }
    | {
          type: 'pan';
          x: number;
          z: number;
      }
    | {
          type: 'reset';
      };

const LAYOUT_AREAS = TOUR_AREAS;
const MODEL_AREAS = TOUR_AREAS.filter((area) => area.id !== 'whole-tour');
const WHOLE_TOUR = TOUR_AREAS[0];
const DEFAULT_LAYOUT_AREA =
    TOUR_AREAS.find((area) => area.id === 'main-hall') ?? WHOLE_TOUR;
const ease = [0.22, 1, 0.36, 1] as const;

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

function LayoutScene({
    activeArea,
    areas,
    viewMode,
    zoomLevel,
    onZoomChange,
}: {
    activeArea: TourArea;
    areas: TourArea[];
    viewMode: LayoutViewMode;
    zoomLevel: number;
    onZoomChange: (nextZoom: number) => void;
}) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const reduceMotion = Boolean(useReducedMotion());
    const zoomLevelRef = useRef(zoomLevel);
    const sceneControlRef = useRef<
        ((command: LayoutSceneCommand) => void) | null
    >(null);

    useEffect(() => {
        zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    const moveScene = (command: LayoutSceneCommand) => {
        sceneControlRef.current?.(command);

        if (command.type === 'reset') {
            onZoomChange(1);
        }
    };

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
        let modelGroup: ThreeGroup | null = null;
        let removeListeners = () => {};
        const materials: ThreeMaterial[] = [];
        const geometries: ThreeGeometry[] = [];
        const textures: ThreeTexture[] = [];

        async function init() {
            try {
                const THREE = await import('three');

                if (disposed) {
                    return;
                }

                scene = new THREE.Scene();
                scene.fog = new THREE.Fog(
                    viewMode === 'interior' ? 0x061625 : 0x07110f,
                    18,
                    42,
                );

                camera = new THREE.PerspectiveCamera(
                    viewMode === 'interior' ? 42 : 48,
                    Math.max(mountElement.clientWidth, 1) /
                        Math.max(mountElement.clientHeight, 1),
                    0.1,
                    120,
                );
                camera.position.set(
                    viewMode === 'interior' ? 10 : 17,
                    viewMode === 'interior' ? 9.2 : 13.2,
                    viewMode === 'interior' ? 13.5 : 23,
                );
                camera.lookAt(
                    viewMode === 'interior' ? 0.4 : 0,
                    viewMode === 'interior' ? 0 : 1.8,
                    viewMode === 'interior' ? 0.25 : 0.7,
                );

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
                    `${viewMode} 3D model of the Baguio Convention and Cultural Center`,
                );
                renderer.domElement.setAttribute('role', 'img');
                renderer.domElement.style.cursor = 'grab';
                mountElement.appendChild(renderer.domElement);

                const ambient = new THREE.AmbientLight(0xffffff, 1.25);
                scene.add(ambient);

                const keyLight = new THREE.DirectionalLight(0xf4dfad, 2.6);
                keyLight.position.set(7, 10, 6);
                scene.add(keyLight);

                const coolLight = new THREE.DirectionalLight(0x9fe8dc, 1.2);
                coolLight.position.set(-8, 4, -7);
                scene.add(coolLight);

                modelGroup = new THREE.Group();
                scene.add(modelGroup);

                const addLine = (
                    points: Array<import('three').Vector3>,
                    color: number,
                    opacity = 0.72,
                ) => {
                    const geometry = new THREE.BufferGeometry().setFromPoints(
                        points,
                    );
                    geometries.push(geometry);
                    const material = new THREE.LineBasicMaterial({
                        color,
                        transparent: true,
                        opacity,
                    });
                    materials.push(material);
                    const line = new THREE.Line(geometry, material);
                    modelGroup?.add(line);

                    return line;
                };

                const createLabelTexture = (
                    text: string,
                    selected: boolean,
                ) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 160;
                    const context = canvas.getContext('2d');

                    if (!context) {
                        return null;
                    }

                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = selected
                        ? 'rgba(244,223,173,0.94)'
                        : viewMode === 'interior'
                          ? 'rgba(8,28,38,0.86)'
                          : 'rgba(6,17,15,0.82)';
                    context.strokeStyle = selected
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(159,232,220,0.55)';
                    context.lineWidth = selected ? 6 : 4;
                    context.beginPath();
                    context.roundRect(18, 34, 476, 92, 20);
                    context.fill();
                    context.stroke();
                    context.fillStyle = selected ? '#102a27' : '#ffffff';
                    context.font = '900 36px Arial';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(text, 256, 80, 420);

                    const texture = new THREE.CanvasTexture(canvas);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    textures.push(texture);

                    return texture;
                };

                const addBox = ({
                    size,
                    position,
                    color,
                    opacity = 1,
                    metalness = 0.08,
                    roughness = 0.62,
                }: {
                    size: [number, number, number];
                    position: [number, number, number];
                    color: number;
                    opacity?: number;
                    metalness?: number;
                    roughness?: number;
                }) => {
                    const geometry = new THREE.BoxGeometry(...size);
                    geometries.push(geometry);
                    const material = new THREE.MeshStandardMaterial({
                        color,
                        metalness,
                        roughness,
                        transparent: opacity < 1,
                        opacity,
                        side: THREE.DoubleSide,
                    });
                    materials.push(material);
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(...position);
                    modelGroup?.add(mesh);

                    return mesh;
                };

                const addCylinder = ({
                    radiusTop,
                    radiusBottom,
                    height,
                    position,
                    color,
                    segments = 24,
                    opacity = 1,
                }: {
                    radiusTop: number;
                    radiusBottom: number;
                    height: number;
                    position: [number, number, number];
                    color: number;
                    segments?: number;
                    opacity?: number;
                }) => {
                    const geometry = new THREE.CylinderGeometry(
                        radiusTop,
                        radiusBottom,
                        height,
                        segments,
                    );
                    geometries.push(geometry);
                    const material = new THREE.MeshStandardMaterial({
                        color,
                        metalness: 0.05,
                        roughness: 0.68,
                        transparent: opacity < 1,
                        opacity,
                    });
                    materials.push(material);
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(...position);
                    modelGroup?.add(mesh);

                    return mesh;
                };

                const addHipRoof = ({
                    width,
                    depth,
                    height,
                    position,
                    color,
                    opacity = 1,
                }: {
                    width: number;
                    depth: number;
                    height: number;
                    position: [number, number, number];
                    color: number;
                    opacity?: number;
                }) => {
                    const halfWidth = width / 2;
                    const halfDepth = depth / 2;
                    const geometry = new THREE.BufferGeometry();
                    const vertices = new Float32Array([
                        -halfWidth,
                        0,
                        -halfDepth,
                        halfWidth,
                        0,
                        -halfDepth,
                        halfWidth,
                        0,
                        halfDepth,
                        -halfWidth,
                        0,
                        halfDepth,
                        0,
                        height,
                        0,
                    ]);
                    geometry.setAttribute(
                        'position',
                        new THREE.BufferAttribute(vertices, 3),
                    );
                    geometry.setIndex([
                        0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 0, 3, 2, 0, 2, 1,
                    ]);
                    geometry.computeVertexNormals();
                    geometries.push(geometry);
                    const material = new THREE.MeshStandardMaterial({
                        color,
                        metalness: 0.04,
                        roughness: 0.82,
                        transparent: opacity < 1,
                        opacity,
                        side: THREE.DoubleSide,
                    });
                    materials.push(material);
                    const roof = new THREE.Mesh(geometry, material);
                    roof.position.set(...position);
                    modelGroup?.add(roof);

                    return roof;
                };

                const addTree = (x: number, z: number, scale = 1) => {
                    addCylinder({
                        radiusTop: 0.08 * scale,
                        radiusBottom: 0.13 * scale,
                        height: 1.1 * scale,
                        position: [x, 0.55 * scale, z],
                        color: 0x594331,
                        segments: 10,
                    });
                    addCylinder({
                        radiusTop: 0.18 * scale,
                        radiusBottom: 0.72 * scale,
                        height: 1.9 * scale,
                        position: [x, 1.55 * scale, z],
                        color: 0x285b42,
                        segments: 12,
                    });
                };

                addBox({
                    size: [26, 0.18, 19],
                    position: [0, -0.16, 0.8],
                    color: viewMode === 'interior' ? 0x061625 : 0x244d3a,
                    roughness: 0.9,
                });

                if (viewMode === 'exterior') {
                    addBox({
                        size: [13.5, 0.08, 8.2],
                        position: [0.2, -0.03, 7.1],
                        color: 0x26302f,
                        roughness: 0.94,
                    });
                    addBox({
                        size: [18.2, 1.25, 9.7],
                        position: [0, 0.63, -0.15],
                        color: 0xd9d7ce,
                        roughness: 0.78,
                    });
                    addBox({
                        size: [13.8, 1.7, 8.25],
                        position: [0, 1.5, -0.4],
                        color: 0xc9c7be,
                        roughness: 0.8,
                    });
                    addHipRoof({
                        width: 18.6,
                        depth: 10.5,
                        height: 4.1,
                        position: [0, 2.34, -0.45],
                        color: 0x665044,
                    });

                    addBox({
                        size: [1.55, 0.72, 1.45],
                        position: [0, 6.55, -0.45],
                        color: 0x2e3432,
                    });
                    addHipRoof({
                        width: 2.1,
                        depth: 1.95,
                        height: 0.7,
                        position: [0, 6.9, -0.45],
                        color: 0x4f3d35,
                    });

                    addBox({
                        size: [12.2, 0.3, 4.0],
                        position: [2.3, 2.7, 5.0],
                        color: 0xe2ddd0,
                        metalness: 0.12,
                        roughness: 0.54,
                    });
                    [-2.4, 0.5, 3.4, 6.4].forEach((x) => {
                        addBox({
                            size: [0.38, 2.65, 0.38],
                            position: [x, 1.35, 5.2],
                            color: 0x5a625d,
                            roughness: 0.9,
                        });
                    });
                    addBox({
                        size: [8.8, 1.95, 0.18],
                        position: [1.2, 1.28, 4.78],
                        color: 0x5e8f92,
                        opacity: 0.72,
                        metalness: 0.2,
                        roughness: 0.25,
                    });
                    [-2.8, -0.8, 1.2, 3.2, 5.2].forEach((x) => {
                        addBox({
                            size: [0.08, 2.0, 0.2],
                            position: [x, 1.3, 4.82],
                            color: 0xd8d6cb,
                        });
                    });

                    addBox({
                        size: [1.55, 4.2, 1.5],
                        position: [-7.7, 2.1, 4.25],
                        color: 0x5a514b,
                        roughness: 0.94,
                    });
                    addBox({
                        size: [1.0, 3.3, 1.58],
                        position: [-6.45, 1.66, 4.25],
                        color: 0xdedbd2,
                        roughness: 0.82,
                    });

                    addCylinder({
                        radiusTop: 1.15,
                        radiusBottom: 1.15,
                        height: 0.13,
                        position: [4.7, 0.05, 7.15],
                        color: 0xd8d4ca,
                        segments: 40,
                    });
                    addCylinder({
                        radiusTop: 0.72,
                        radiusBottom: 0.84,
                        height: 0.22,
                        position: [4.7, 0.2, 7.15],
                        color: 0x4d8f9b,
                        segments: 40,
                    });
                    addCylinder({
                        radiusTop: 0.12,
                        radiusBottom: 0.22,
                        height: 0.65,
                        position: [4.7, 0.58, 7.15],
                        color: 0xc5b274,
                        segments: 20,
                    });

                    [-2.1, -0.8, 0.5, 1.8, 7.0].forEach((x) => {
                        addCylinder({
                            radiusTop: 0.025,
                            radiusBottom: 0.035,
                            height: 3.25,
                            position: [x, 1.63, 7.0],
                            color: 0xd8dedb,
                            segments: 8,
                        });
                    });

                    [
                        [-10.4, -2.4, 1.25],
                        [-10.7, 2.0, 1.1],
                        [10.3, -2.1, 1.2],
                        [10.5, 2.8, 1.05],
                        [-8.9, 7.0, 0.88],
                        [9.1, 7.7, 0.88],
                    ].forEach(([x, z, scale]) => addTree(x, z, scale));
                } else {
                    const gridHelper = new THREE.GridHelper(
                        24,
                        32,
                        0x9fe8dc,
                        0x24475e,
                    );
                    gridHelper.position.y = -0.04;
                    modelGroup.add(gridHelper);

                    addLine(
                        [
                            new THREE.Vector3(-9.5, 0.04, -5.8),
                            new THREE.Vector3(9.5, 0.04, -5.8),
                            new THREE.Vector3(9.5, 0.04, 5.8),
                            new THREE.Vector3(-9.5, 0.04, 5.8),
                            new THREE.Vector3(-9.5, 0.04, -5.8),
                        ],
                        0xf4dfad,
                        0.86,
                    );
                    addLine(
                        [
                            new THREE.Vector3(-8.2, 0.12, 4.8),
                            new THREE.Vector3(-5.1, 0.12, 1.4),
                            new THREE.Vector3(-3.0, 0.12, 0.4),
                            new THREE.Vector3(0.2, 0.12, 0.2),
                            new THREE.Vector3(2.2, 0.12, 1.0),
                            new THREE.Vector3(5.8, 0.12, 1.0),
                            new THREE.Vector3(8.4, 0.12, 1.2),
                        ],
                        0x9fe8dc,
                        0.8,
                    );

                    addBox({
                        size: [8.0, 0.24, 4.8],
                        position: [3.3, 0.18, 1.1],
                        color: 0x176456,
                        opacity: 0.52,
                    });
                    addBox({
                        size: [2.4, 0.46, 0.9],
                        position: [3.3, 0.38, 3.05],
                        color: 0xf4dfad,
                        opacity: 0.74,
                    });
                    [-0.7, 0.2, 1.1, 5.5, 6.4, 7.3].forEach((x) => {
                        addBox({
                            size: [0.55, 0.22, 2.8],
                            position: [x, 0.46, 0.6],
                            color: 0x9fe8dc,
                            opacity: 0.32,
                        });
                    });
                }

                const showingWhole = activeArea.id === WHOLE_TOUR.id;

                areas.forEach((area) => {
                    const selected = showingWhole || area.id === activeArea.id;
                    const exactSelection = area.id === activeArea.id;
                    const footprint = area.footprint;
                    const height =
                        viewMode === 'interior'
                            ? footprint.height * 0.82
                            : 0.08;
                    const geometry = new THREE.BoxGeometry(
                        footprint.width,
                        height,
                        footprint.depth,
                    );
                    geometries.push(geometry);

                    const material = new THREE.MeshStandardMaterial({
                        color: footprint.color,
                        metalness: viewMode === 'interior' ? 0.08 : 0.02,
                        roughness: viewMode === 'interior' ? 0.72 : 0.9,
                        transparent: true,
                        opacity:
                            viewMode === 'interior'
                                ? selected
                                    ? 0.34
                                    : 0.2
                                : exactSelection
                                  ? 0.4
                                  : 0.035,
                        depthWrite: viewMode === 'interior',
                        side: THREE.DoubleSide,
                    });
                    materials.push(material);

                    const block = new THREE.Mesh(geometry, material);
                    block.position.set(footprint.x, height / 2, footprint.z);
                    block.userData.baseY = block.position.y;
                    modelGroup?.add(block);

                    if (viewMode === 'interior') {
                        const floorGeometry = new THREE.PlaneGeometry(
                            footprint.width * 0.9,
                            footprint.depth * 0.9,
                        );
                        geometries.push(floorGeometry);
                        const floorMaterial = new THREE.MeshBasicMaterial({
                            color: selected ? 0xf4dfad : 0x9fe8dc,
                            transparent: true,
                            opacity: selected ? 0.2 : 0.1,
                            side: THREE.DoubleSide,
                        });
                        materials.push(floorMaterial);
                        const floor = new THREE.Mesh(
                            floorGeometry,
                            floorMaterial,
                        );
                        floor.rotation.x = -Math.PI / 2;
                        floor.position.set(footprint.x, 0.03, footprint.z);
                        modelGroup?.add(floor);

                        addLine(
                            [
                                new THREE.Vector3(
                                    footprint.x - footprint.width * 0.36,
                                    0.16,
                                    footprint.z,
                                ),
                                new THREE.Vector3(
                                    footprint.x + footprint.width * 0.36,
                                    0.16,
                                    footprint.z,
                                ),
                            ],
                            selected ? 0xffffff : 0x9fe8dc,
                            selected ? 0.48 : 0.22,
                        );
                        addLine(
                            [
                                new THREE.Vector3(
                                    footprint.x,
                                    0.16,
                                    footprint.z - footprint.depth * 0.36,
                                ),
                                new THREE.Vector3(
                                    footprint.x,
                                    0.16,
                                    footprint.z + footprint.depth * 0.36,
                                ),
                            ],
                            selected ? 0xffffff : 0x9fe8dc,
                            selected ? 0.48 : 0.22,
                        );
                    }

                    const edgeGeometry = new THREE.EdgesGeometry(geometry);
                    geometries.push(edgeGeometry);
                    const edgeMaterial = new THREE.LineBasicMaterial({
                        color:
                            viewMode === 'interior'
                                ? selected
                                    ? 0xffffff
                                    : 0x9fe8dc
                                : selected
                                  ? 0xffffff
                                  : 0xf4dfad,
                        transparent: true,
                        opacity:
                            viewMode === 'interior'
                                ? selected
                                    ? 0.9
                                    : 0.32
                                : exactSelection
                                  ? 0.8
                                  : 0.04,
                    });
                    materials.push(edgeMaterial);
                    const edges = new THREE.LineSegments(
                        edgeGeometry,
                        edgeMaterial,
                    );
                    edges.position.copy(block.position);
                    modelGroup?.add(edges);

                    if (exactSelection) {
                        const markerGeometry = new THREE.CylinderGeometry(
                            0.22,
                            0.22,
                            0.12,
                            32,
                        );
                        geometries.push(markerGeometry);
                        const markerMaterial = new THREE.MeshBasicMaterial({
                            color: 0xf4dfad,
                            transparent: true,
                            opacity: 0.9,
                        });
                        materials.push(markerMaterial);
                        const marker = new THREE.Mesh(
                            markerGeometry,
                            markerMaterial,
                        );
                        marker.position.set(
                            footprint.x,
                            viewMode === 'exterior' ? 0.22 : height + 0.25,
                            footprint.z,
                        );
                        modelGroup?.add(marker);

                        if (viewMode === 'exterior') {
                            addLine(
                                [
                                    new THREE.Vector3(
                                        footprint.x,
                                        0.28,
                                        footprint.z,
                                    ),
                                    new THREE.Vector3(
                                        footprint.x,
                                        7.05,
                                        footprint.z,
                                    ),
                                ],
                                0xf4dfad,
                                0.72,
                            );
                        }
                    }

                    const labelTexture = createLabelTexture(
                        area.shortLabel,
                        selected,
                    );

                    if (
                        labelTexture &&
                        (viewMode === 'interior' || exactSelection)
                    ) {
                        const labelMaterial = new THREE.SpriteMaterial({
                            map: labelTexture,
                            transparent: true,
                            opacity: selected ? 0.96 : 0.62,
                            depthTest: false,
                        });
                        materials.push(labelMaterial);
                        const label = new THREE.Sprite(labelMaterial);
                        label.position.set(
                            footprint.x,
                            viewMode === 'exterior'
                                ? 7.45
                                : height + (selected ? 0.84 : 0.58),
                            footprint.z,
                        );
                        label.scale.set(
                            selected ? 2.05 : 1.42,
                            selected ? 0.64 : 0.44,
                            1,
                        );
                        modelGroup?.add(label);
                    }
                });

                let dragRotation = -0.2;
                let tiltOffset = 0;
                let manualPanX = 0;
                let manualPanZ = 0;
                let startRotation = 0;
                let startTiltOffset = 0;
                let startPanX = 0;
                let startPanZ = 0;
                let startX = 0;
                let startY = 0;
                let dragging = false;
                let dragMode: 'orbit' | 'pan' = 'orbit';

                sceneControlRef.current = (command) => {
                    if (command.type === 'reset') {
                        dragRotation = -0.2;
                        tiltOffset = 0;
                        manualPanX = 0;
                        manualPanZ = 0;

                        return;
                    }

                    if (command.type === 'rotate') {
                        dragRotation += command.amount;
                    }

                    if (command.type === 'tilt') {
                        tiltOffset = Math.min(
                            1.85,
                            Math.max(-1.65, tiltOffset + command.amount),
                        );
                    }

                    if (command.type === 'pan') {
                        manualPanX = Math.min(
                            4.8,
                            Math.max(-4.8, manualPanX + command.x),
                        );
                        manualPanZ = Math.min(
                            4.2,
                            Math.max(-4.2, manualPanZ + command.z),
                        );
                    }
                };

                const handlePointerDown = (event: PointerEvent) => {
                    dragging = true;
                    startX = event.clientX;
                    startY = event.clientY;
                    startRotation = dragRotation;
                    startTiltOffset = tiltOffset;
                    startPanX = manualPanX;
                    startPanZ = manualPanZ;
                    dragMode = event.shiftKey ? 'pan' : 'orbit';
                    renderer?.domElement.style.setProperty(
                        'cursor',
                        dragMode === 'pan' ? 'move' : 'grabbing',
                    );
                    renderer?.domElement.setPointerCapture(event.pointerId);
                };

                const handlePointerMove = (event: PointerEvent) => {
                    if (!dragging) {
                        return;
                    }

                    const deltaX = event.clientX - startX;
                    const deltaY = event.clientY - startY;

                    if (dragMode === 'pan') {
                        manualPanX = Math.min(
                            4.8,
                            Math.max(-4.8, startPanX + deltaX * 0.018),
                        );
                        manualPanZ = Math.min(
                            4.2,
                            Math.max(-4.2, startPanZ + deltaY * 0.018),
                        );

                        return;
                    }

                    dragRotation = startRotation + deltaX * 0.0045;
                    tiltOffset = Math.min(
                        1.85,
                        Math.max(-1.65, startTiltOffset - deltaY * 0.012),
                    );
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
                    const direction = event.deltaY < 0 ? 0.12 : -0.12;
                    onZoomChange(
                        Math.min(
                            2.2,
                            Math.max(0.62, zoomLevelRef.current + direction),
                        ),
                    );
                };
                const handleKeyDown = (event: KeyboardEvent) => {
                    if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        sceneControlRef.current?.(
                            event.shiftKey
                                ? { type: 'pan', x: -0.38, z: 0 }
                                : {
                                      type: 'rotate',
                                      amount: -0.24,
                                  },
                        );
                    }

                    if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        sceneControlRef.current?.(
                            event.shiftKey
                                ? { type: 'pan', x: 0.38, z: 0 }
                                : {
                                      type: 'rotate',
                                      amount: 0.24,
                                  },
                        );
                    }

                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        sceneControlRef.current?.(
                            event.shiftKey
                                ? { type: 'pan', x: 0, z: -0.38 }
                                : {
                                      type: 'tilt',
                                      amount: 0.24,
                                  },
                        );
                    }

                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        sceneControlRef.current?.(
                            event.shiftKey
                                ? { type: 'pan', x: 0, z: 0.38 }
                                : {
                                      type: 'tilt',
                                      amount: -0.24,
                                  },
                        );
                    }

                    if (event.key === '+' || event.key === '=') {
                        event.preventDefault();
                        onZoomChange(
                            Math.min(2.2, zoomLevelRef.current + 0.12),
                        );
                    }

                    if (event.key === '-') {
                        event.preventDefault();
                        onZoomChange(
                            Math.max(0.62, zoomLevelRef.current - 0.12),
                        );
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

                removeListeners = () => {
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
                    window.removeEventListener('resize', handleResize);
                };

                const clock = new THREE.Clock();
                const render = () => {
                    if (
                        disposed ||
                        !renderer ||
                        !scene ||
                        !camera ||
                        !modelGroup
                    ) {
                        return;
                    }

                    const elapsed = clock.getElapsedTime();
                    const zoom = zoomLevelRef.current;
                    camera.position.set(
                        (viewMode === 'interior' ? 10 : 17) / zoom,
                        Math.max(
                            viewMode === 'interior' ? 4.6 : 8.5,
                            (viewMode === 'interior' ? 8.2 : 13.2) /
                                Math.sqrt(zoom) +
                                tiltOffset,
                        ),
                        (viewMode === 'interior' ? 13.5 : 23) / zoom,
                    );
                    camera.lookAt(
                        viewMode === 'interior' ? 0.4 : 0,
                        (viewMode === 'interior' ? 0.34 : 1.8) +
                            tiltOffset * 0.12,
                        viewMode === 'interior' ? 0.25 : 0.7,
                    );

                    modelGroup.rotation.y =
                        dragRotation + (reduceMotion ? 0 : elapsed * 0.025);
                    const focusedFootprint =
                        activeArea.id === WHOLE_TOUR.id
                            ? null
                            : activeArea.footprint;
                    const focusMultiplier =
                        Math.min(zoom, 1.8) *
                        (viewMode === 'interior' ? 0.18 : 0.06);
                    modelGroup.position.x = THREE.MathUtils.lerp(
                        modelGroup.position.x,
                        (focusedFootprint
                            ? -focusedFootprint.x * focusMultiplier
                            : 0) + manualPanX,
                        0.06,
                    );
                    modelGroup.position.z = THREE.MathUtils.lerp(
                        modelGroup.position.z,
                        (focusedFootprint
                            ? -focusedFootprint.z * focusMultiplier
                            : 0) + manualPanZ,
                        0.06,
                    );
                    modelGroup.position.y =
                        (reduceMotion ? 0 : Math.sin(elapsed * 0.7) * 0.03) +
                        (viewMode === 'interior' ? 0.12 : 0);

                    renderer.render(scene, camera);
                    frame = window.requestAnimationFrame(render);
                };

                render();
            } catch {
                mountElement.dataset.webglUnavailable = 'true';
            }
        }

        void init();

        return () => {
            disposed = true;
            window.cancelAnimationFrame(frame);
            removeListeners();
            sceneControlRef.current = null;

            materials.forEach((material) => material.dispose());
            geometries.forEach((geometry) => geometry.dispose());
            textures.forEach((texture) => texture.dispose());

            if (renderer?.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }

            renderer?.dispose();
            scene?.clear();
            modelGroup?.clear();
        };
    }, [activeArea, areas, onZoomChange, reduceMotion, viewMode]);

    return (
        <div className="bccc-convention-layout-scene absolute inset-0">
            <div
                ref={mountRef}
                className="absolute inset-0 bg-[radial-gradient(circle_at_52%_18%,rgba(244,223,173,0.18),transparent_32%),linear-gradient(145deg,#07110f,#17483d_52%,#040706)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.74),rgba(0,0,0,0.22)_44%,rgba(0,0,0,0.58))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-[#9fe8dc]/18 bg-[#041116]/58 px-3 py-2 text-[10px] font-black tracking-[0.16em] text-[#9fe8dc] uppercase backdrop-blur-xl">
                {viewMode === 'interior'
                    ? 'BCCC Interior Cutaway'
                    : 'BCCC Exterior Model'}
            </div>

            <div className="bccc-scene-orbit-controls absolute top-16 left-4 z-20 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/12 bg-black/42 p-2 backdrop-blur-xl sm:top-20">
                <span />
                <button
                    type="button"
                    onClick={() => moveScene({ type: 'tilt', amount: 0.24 })}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/8 text-white/72 transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                    title="Tilt up"
                >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Tilt up</span>
                </button>
                <span />
                <button
                    type="button"
                    onClick={() => moveScene({ type: 'rotate', amount: -0.24 })}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/8 text-white/72 transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                    title="Rotate left"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Rotate left</span>
                </button>
                <button
                    type="button"
                    onClick={() => moveScene({ type: 'reset' })}
                    className="grid h-10 w-10 place-items-center rounded-full border border-[#f4dfad]/30 bg-[#f4dfad]/14 text-[#f4dfad] transition hover:bg-[#f4dfad] hover:text-[#102a27]"
                    title="Reset model view"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">Reset model view</span>
                </button>
                <button
                    type="button"
                    onClick={() => moveScene({ type: 'rotate', amount: 0.24 })}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/8 text-white/72 transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                    title="Rotate right"
                >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Rotate right</span>
                </button>
                <span />
                <button
                    type="button"
                    onClick={() => moveScene({ type: 'tilt', amount: -0.24 })}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/8 text-white/72 transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                    title="Tilt down"
                >
                    <ArrowDown className="h-4 w-4" />
                    <span className="sr-only">Tilt down</span>
                </button>
                <span />
            </div>

            <div className="pointer-events-none absolute right-4 bottom-4 rounded-full border border-white/12 bg-black/42 px-3 py-2 text-[10px] font-black tracking-[0.14em] text-white/62 uppercase backdrop-blur-xl max-sm:hidden">
                {activeArea.shortLabel} / {Math.round(zoomLevel * 100)}%
            </div>
        </div>
    );
}

function BlueprintLegend({ viewMode }: { viewMode: LayoutViewMode }) {
    const items = [
        {
            label: 'Selected layer',
            value:
                viewMode === 'interior' ? 'see-through focus' : 'raised mass',
            className: 'bg-[#f4dfad]',
        },
        {
            label: 'Public route',
            value: 'arrival to support path',
            className: 'bg-[#9fe8dc]',
        },
        {
            label: viewMode === 'interior' ? 'Room volume' : 'Roof plate',
            value:
                viewMode === 'interior' ? 'transparent shell' : 'exterior cap',
            className:
                viewMode === 'interior' ? 'bg-[#9fe8dc]/45' : 'bg-[#142f2a]',
        },
    ];

    return (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/18 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                <Route className="h-3.5 w-3.5" />
                Blueprint key
            </div>
            <div className="mt-3 grid gap-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-2.5"
                    >
                        <span
                            className={cx(
                                'h-4 w-4 shrink-0 rounded-sm border border-white/28',
                                item.className,
                            )}
                        />
                        <span className="min-w-0">
                            <span className="block text-xs font-black text-white">
                                {item.label}
                            </span>
                            <span className="mt-0.5 block text-[10px] font-bold tracking-[0.1em] text-white/44 uppercase">
                                {item.value}
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LayerButton({
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
                'group flex min-h-16 items-start gap-3 rounded-lg border p-3 text-left transition duration-300',
                selected
                    ? 'border-[#f4dfad]/70 bg-[#f4dfad] text-[#102a27] shadow-[0_18px_44px_rgba(0,0,0,0.22)]'
                    : 'border-white/12 bg-white/8 text-white/74 hover:border-white/28 hover:bg-white/13 hover:text-white',
            )}
        >
            <button
                type="button"
                onClick={() => onSelect(area)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
                <span
                    className={cx(
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border',
                        selected
                            ? 'border-[#102a27]/14 bg-[#102a27]/10 text-[#102a27]'
                            : 'border-white/12 bg-black/16 text-[#f4dfad]',
                    )}
                >
                    <Layers3 className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-black">
                        {area.label}
                    </span>
                    <span
                        className={cx(
                            'mt-1 block text-[10px] font-bold tracking-[0.12em] uppercase',
                            selected ? 'text-[#102a27]/60' : 'text-white/42',
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
                    'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition',
                    selected
                        ? 'border-[#102a27]/18 bg-white/28 text-[#102a27] hover:bg-white/48'
                        : 'border-white/12 bg-black/20 text-[#f4dfad] hover:border-[#f4dfad]/46 hover:bg-[#f4dfad] hover:text-[#102a27]',
                )}
            >
                <ScanEye className="h-4 w-4" />
                <span className="sr-only">Open {area.label} preview</span>
            </button>
        </div>
    );
}

function BcccLayoutPanel({
    activeArea,
    viewMode,
    zoom,
    onSelectArea,
    onViewModeChange,
    onZoomChange,
    onPreview,
}: {
    activeArea: TourArea;
    viewMode: LayoutViewMode;
    zoom: number;
    onSelectArea: (area: TourArea) => void;
    onViewModeChange: (mode: LayoutViewMode) => void;
    onZoomChange: (zoom: number) => void;
    onPreview: (area: TourArea) => void;
}) {
    return (
        <aside className="bccc-bccc-layout-panel flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a1c18] text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
            <div className="relative overflow-hidden border-b border-white/10">
                <img
                    src="/marketing/images/hero/bccc.png"
                    alt="Baguio Convention and Cultural Center exterior reference"
                    className="h-36 w-full object-cover object-center opacity-58"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1c18] via-[#0a1c18]/42 to-black/12" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.18em] text-[#f4dfad] uppercase">
                        <Building2 className="h-3.5 w-3.5" />
                        BCCC architectural explorer
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                        Baguio Convention & Cultural Center
                    </h2>
                </div>
            </div>

            <div className="border-b border-white/10 p-3.5">
                <div className="grid grid-cols-2 gap-2">
                    {(
                        [
                            ['exterior', 'Exterior'],
                            ['interior', 'Interior cutaway'],
                        ] as const
                    ).map(([mode, label]) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => onViewModeChange(mode)}
                            aria-pressed={viewMode === mode}
                            className={cx(
                                'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-[9px] font-black tracking-[0.12em] uppercase transition',
                                viewMode === mode
                                    ? 'border-[#f4dfad] bg-[#f4dfad] text-[#102a27]'
                                    : 'border-white/10 bg-white/[0.055] text-white/58 hover:border-white/24 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            {mode === 'exterior' ? (
                                <Building2 className="h-3.5 w-3.5" />
                            ) : (
                                <Eye className="h-3.5 w-3.5" />
                            )}
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onZoomChange(zoom - 0.14)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.055] text-white/68 transition hover:bg-white/12 hover:text-white"
                        title="Zoom out"
                    >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Zoom out</span>
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3 text-[8px] font-black tracking-[0.14em] text-white/42 uppercase">
                            <span>Model zoom</span>
                            <span className="text-[#f4dfad]">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#9fe8dc,#f4dfad)]"
                                style={{
                                    width: `${Math.round(
                                        ((zoom - 0.62) / (2.2 - 0.62)) * 100,
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onZoomChange(zoom + 0.14)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.055] text-white/68 transition hover:bg-white/12 hover:text-white"
                        title="Zoom in"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Zoom in</span>
                    </button>
                </div>
            </div>

            <div className="border-b border-white/10 p-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[8px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                            Selected building layer
                        </p>
                        <h3 className="mt-1.5 truncate text-lg font-semibold text-white">
                            {activeArea.label}
                        </h3>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#9fe8dc]/20 bg-[#9fe8dc]/10 px-2.5 py-1 text-[8px] font-black tracking-[0.1em] text-[#9fe8dc] uppercase">
                        {activeArea.category}
                    </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 font-semibold text-white/52">
                    {activeArea.layoutNote}
                </p>
                <button
                    type="button"
                    onClick={() => onPreview(activeArea)}
                    className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-[9px] font-black tracking-[0.12em] text-white/64 uppercase transition hover:border-[#f4dfad]/40 hover:bg-[#f4dfad] hover:text-[#102a27]"
                >
                    Area details
                    <ScanEye className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 p-3.5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.16em] text-[#f4dfad] uppercase">
                        <Layers3 className="h-3.5 w-3.5" />
                        Building layers
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-[8px] font-black text-white/48">
                        {LAYOUT_AREAS.length}
                    </span>
                </div>
                <div className="mt-3 grid max-h-full grid-cols-2 gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {LAYOUT_AREAS.map((area) => (
                        <button
                            key={`focused-layer-${area.id}`}
                            type="button"
                            onClick={() => onSelectArea(area)}
                            aria-pressed={area.id === activeArea.id}
                            className={cx(
                                'min-h-11 rounded-lg border px-2.5 text-left text-[8px] font-black tracking-[0.08em] uppercase transition',
                                area.id === activeArea.id
                                    ? 'border-[#f4dfad] bg-[#f4dfad] text-[#102a27]'
                                    : 'border-white/10 bg-white/[0.05] text-white/56 hover:border-white/24 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            <span className="block truncate">
                                {area.shortLabel}
                            </span>
                            <span
                                className={cx(
                                    'mt-0.5 block truncate text-[7px]',
                                    area.id === activeArea.id
                                        ? 'text-[#102a27]/55'
                                        : 'text-white/28',
                                )}
                            >
                                {area.category}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/10 p-3.5">
                <Link
                    href="/virtual-tour"
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f4dfad] px-3 text-[9px] font-black tracking-[0.12em] text-[#102a27] uppercase transition hover:bg-white"
                >
                    Open 360 virtual tour
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </aside>
    );
}

export default function ConventionLayoutPage() {
    const reduceMotion = useReducedMotion();
    const [activeArea, setActiveArea] = useState<TourArea>(DEFAULT_LAYOUT_AREA);
    const [previewArea, setPreviewArea] = useState<TourArea | null>(null);
    const [viewMode, setViewMode] = useState<LayoutViewMode>('exterior');
    const [layoutZoom, setLayoutZoom] = useState(1);
    const {
        isViewerExpanded: isLayoutViewerExpanded,
        shellRef: layoutShellRef,
        toggleFullscreen: toggleLayoutFullscreen,
    } = useFullscreenViewer();
    const activeIndex = useMemo(
        () => LAYOUT_AREAS.findIndex((area) => area.id === activeArea.id),
        [activeArea],
    );
    const modeGuidance = LAYOUT_VIEW_GUIDANCE[viewMode];
    const changeLayoutZoom = useCallback((nextZoom: number) => {
        setLayoutZoom(Math.min(2.2, Math.max(0.62, nextZoom)));
    }, []);
    const openPreview = (area: TourArea) => {
        setActiveArea(area);
        setPreviewArea(area);
    };

    if (MODEL_AREAS.length > 0) {
        return (
            <PublicLayout>
                <Head title="BCCC 3D Layout" />

                <section className="bccc-convention-layout-page bccc-focused-layout-page bg-[#07110f] text-white">
                    <div className="bccc-focused-layout-workspace grid gap-3 p-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(21rem,0.75fr)] lg:gap-4 lg:p-4">
                        <motion.div
                            ref={layoutShellRef}
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
                                'bccc-windowed-layout-shell bccc-focused-layout-view relative min-h-0 overflow-hidden rounded-xl border border-white/12 bg-black/30 shadow-[0_26px_90px_rgba(0,0,0,0.4)]',
                                isLayoutViewerExpanded && 'is-viewer-expanded',
                            )}
                        >
                            <LayoutScene
                                activeArea={activeArea}
                                areas={MODEL_AREAS}
                                viewMode={viewMode}
                                zoomLevel={layoutZoom}
                                onZoomChange={changeLayoutZoom}
                            />
                            <button
                                type="button"
                                onClick={toggleLayoutFullscreen}
                                aria-pressed={isLayoutViewerExpanded}
                                className="bccc-viewer-fullscreen-button absolute top-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/14 bg-black/46 text-white/78 backdrop-blur-xl transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                                title={
                                    isLayoutViewerExpanded
                                        ? 'Exit fullscreen'
                                        : 'Open fullscreen'
                                }
                            >
                                {isLayoutViewerExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {isLayoutViewerExpanded
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
                            <BcccLayoutPanel
                                activeArea={activeArea}
                                viewMode={viewMode}
                                zoom={layoutZoom}
                                onSelectArea={setActiveArea}
                                onViewModeChange={setViewMode}
                                onZoomChange={changeLayoutZoom}
                                onPreview={openPreview}
                            />
                        </motion.div>
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

    return (
        <PublicLayout>
            <Head title="3D Convention Layout - Coming Soon" />

            <section className="bccc-convention-layout-page bccc-luxury-preview-page relative min-h-[calc(100svh-var(--bccc-public-header-h))] overflow-hidden bg-[#07110f] text-white">
                <div className="bccc-luxury-preview-stage relative z-10 grid min-h-[calc(100svh-var(--bccc-public-header-h))] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(23rem,35rem)] lg:px-8 lg:py-10 xl:px-12">
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
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Architectural Layout Preview
                            </div>

                            <h1 className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.35rem)] leading-[0.9] font-semibold tracking-normal text-balance text-white">
                                3D convention layout.
                            </h1>

                            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/76 sm:text-base sm:leading-8">
                                A professional coming-soon model inspired by an
                                architectural plan: see the full BCCC footprint,
                                public areas, meeting spaces, production support
                                zones, and exterior grounds as one connected
                                layout.
                            </p>

                            <div className="bccc-luxury-preview-stats mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                                <div>
                                    <strong>{MODEL_AREAS.length}</strong>
                                    <span>area layers</span>
                                </div>
                                <div>
                                    <strong>CAD</strong>
                                    <span>style preview</span>
                                </div>
                                <div>
                                    <strong>3D</strong>
                                    <span>venue massing</span>
                                </div>
                            </div>

                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/virtual-tour"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#102a27] uppercase transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                    360 Visit Preview
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/facilities"
                                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-white/9 px-5 text-[11px] font-black tracking-[0.14em] text-white uppercase backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15"
                                >
                                    Facilities
                                    <Building2 className="h-4 w-4" />
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            ref={layoutShellRef}
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
                                'bccc-windowed-layout-shell relative mt-7 overflow-hidden rounded-xl border border-white/14 bg-black/28 shadow-[0_34px_110px_rgba(0,0,0,0.42)]',
                                isLayoutViewerExpanded && 'is-viewer-expanded',
                            )}
                        >
                            <LayoutScene
                                activeArea={activeArea}
                                areas={MODEL_AREAS}
                                viewMode={viewMode}
                                zoomLevel={layoutZoom}
                                onZoomChange={changeLayoutZoom}
                            />
                            <button
                                type="button"
                                onClick={toggleLayoutFullscreen}
                                aria-pressed={isLayoutViewerExpanded}
                                className="bccc-viewer-fullscreen-button absolute top-4 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/14 bg-black/46 text-white/78 backdrop-blur-xl transition hover:border-[#f4dfad]/50 hover:bg-[#f4dfad] hover:text-[#102a27]"
                                title={
                                    isLayoutViewerExpanded
                                        ? 'Exit fullscreen'
                                        : 'Open fullscreen'
                                }
                            >
                                {isLayoutViewerExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {isLayoutViewerExpanded
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
                                    Active layer
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                                    {activeArea.label}
                                </h2>
                            </div>
                            <span className="rounded-full border border-[#f4dfad]/28 bg-[#f4dfad]/12 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-[#f4dfad] uppercase">
                                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                                {String(LAYOUT_AREAS.length).padStart(2, '0')}
                            </span>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-white/66">
                            {activeArea.layoutNote}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/18 p-3">
                            {[
                                ['Width', activeArea.footprint.width],
                                ['Depth', activeArea.footprint.depth],
                                ['Height', activeArea.footprint.height],
                            ].map(([label, value]) => (
                                <div
                                    key={String(label)}
                                    className="rounded-md border border-white/10 bg-white/[0.055] p-2"
                                >
                                    <p className="text-[9px] font-black tracking-[0.14em] text-white/42 uppercase">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-sm font-black text-[#f4dfad]">
                                        {Number(value).toFixed(1)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 rounded-lg border border-white/10 bg-white/8 p-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black tracking-[0.16em] text-white/48 uppercase">
                                    Layer readiness
                                </span>
                                <span className="rounded-full bg-[#f4dfad] px-2.5 py-1 text-[10px] font-black text-[#102a27]">
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
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                <div className="rounded-md border border-white/10 bg-black/18 p-2">
                                    <p className="text-[9px] font-black tracking-[0.14em] text-white/42 uppercase">
                                        Nodes
                                    </p>
                                    <p className="mt-1 text-sm font-black text-white">
                                        {activeArea.preview.routeNodes.length}
                                    </p>
                                </div>
                                <div className="rounded-md border border-white/10 bg-black/18 p-2">
                                    <p className="text-[9px] font-black tracking-[0.14em] text-white/42 uppercase">
                                        Media
                                    </p>
                                    <p className="mt-1 text-sm font-black text-white">
                                        {activeArea.preview.mediaNeeds.length}
                                    </p>
                                </div>
                                <div className="rounded-md border border-white/10 bg-black/18 p-2">
                                    <p className="text-[9px] font-black tracking-[0.14em] text-white/42 uppercase">
                                        Mode
                                    </p>
                                    <p className="mt-1 truncate text-sm font-black text-white capitalize">
                                        {viewMode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/8 p-3">
                            <div>
                                <p className="text-[10px] font-black tracking-[0.16em] text-white/48 uppercase">
                                    View mode
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            ['exterior', 'Exterior'],
                                            ['interior', 'Interior'],
                                        ] as const
                                    ).map(([mode, label]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setViewMode(mode)}
                                            aria-pressed={viewMode === mode}
                                            className={cx(
                                                'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3 text-[10px] font-black tracking-[0.14em] uppercase transition',
                                                viewMode === mode
                                                    ? 'border-[#f4dfad] bg-[#f4dfad] text-[#102a27]'
                                                    : 'border-white/12 bg-black/18 text-white/62 hover:border-white/28 hover:text-white',
                                            )}
                                        >
                                            {mode === 'exterior' ? (
                                                <Building2 className="h-3.5 w-3.5" />
                                            ) : (
                                                <Eye className="h-3.5 w-3.5" />
                                            )}
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 rounded-lg border border-white/10 bg-black/18 p-3">
                                    <p className="text-xs font-black text-white">
                                        {modeGuidance.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 font-semibold text-white/58">
                                        {modeGuidance.detail}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black tracking-[0.16em] text-white/48 uppercase">
                                        Layout zoom
                                    </p>
                                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-black text-[#f4dfad]">
                                        {Math.round(layoutZoom * 100)}%
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeLayoutZoom(layoutZoom - 0.14)
                                        }
                                        className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/20 text-white/72 transition hover:bg-white/12 hover:text-white"
                                        title="Zoom out"
                                    >
                                        <Minus className="h-4 w-4" />
                                        <span className="sr-only">
                                            Zoom out
                                        </span>
                                    </button>
                                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-[linear-gradient(90deg,#9fe8dc,#f4dfad)]"
                                            style={{
                                                width: `${Math.round(
                                                    ((layoutZoom - 0.62) /
                                                        (2.2 - 0.62)) *
                                                        100,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeLayoutZoom(layoutZoom + 0.14)
                                        }
                                        className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/20 text-white/72 transition hover:bg-white/12 hover:text-white"
                                        title="Zoom in"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span className="sr-only">Zoom in</span>
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => changeLayoutZoom(1)}
                                    className="mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-full border border-white/12 bg-black/18 px-3 text-[10px] font-black tracking-[0.14em] text-white/62 uppercase transition hover:bg-white/12 hover:text-white"
                                >
                                    Reset blueprint zoom
                                </button>
                            </div>
                        </div>

                        <BlueprintLegend viewMode={viewMode} />

                        <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/8 p-3 sm:grid-cols-2">
                            <p className="flex items-center gap-2 text-xs leading-6 font-semibold text-white/72">
                                <Ruler className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                                Conceptual massing, not final dimensions.
                            </p>
                            <p className="flex items-center gap-2 text-xs leading-6 font-semibold text-white/72">
                                <MapPinned className="h-4 w-4 shrink-0 text-[#f4dfad]" />
                                Planned for public wayfinding.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => openPreview(activeArea)}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f4dfad] px-5 text-[11px] font-black tracking-[0.14em] text-[#102a27] uppercase transition hover:bg-white"
                        >
                            Open Layer Preview
                            <ScanEye className="h-4 w-4" />
                        </button>

                        <div className="mt-5 grid max-h-[22rem] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] sm:max-h-[30rem] lg:max-h-[44vh]">
                            {LAYOUT_AREAS.map((area) => (
                                <LayerButton
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
                <div className="mx-auto grid max-w-[1480px] gap-7 lg:grid-cols-[0.74fr_1.26fr]">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#176456]/18 bg-white/70 px-4 py-2 text-[10px] font-black tracking-[0.18em] text-[#176456] uppercase dark:border-white/10 dark:bg-white/8 dark:text-[#9fe8dc]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Layout intent
                        </div>
                        <h2 className="mt-4 text-4xl leading-tight font-semibold text-[#143f38] sm:text-5xl dark:text-white">
                            A future public planning view before a site visit or
                            booking.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-[#53645f] dark:text-white/64">
                            This page is designed as the architectural companion
                            to the 360 tour: one page for moving through the
                            venue, and this page for understanding the whole
                            convention layout.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {(
                                [
                                    ['exterior', LAYOUT_VIEW_GUIDANCE.exterior],
                                    ['interior', LAYOUT_VIEW_GUIDANCE.interior],
                                ] as const
                            ).map(([mode, guidance]) => (
                                <div
                                    key={mode}
                                    className="rounded-xl border border-[#176456]/14 bg-white p-5 shadow-[0_18px_50px_rgba(14,60,52,0.08)] dark:border-white/10 dark:bg-white/[0.055]"
                                >
                                    {mode === 'exterior' ? (
                                        <Building2 className="h-5 w-5 text-[#176456] dark:text-[#9fe8dc]" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-[#176456] dark:text-[#9fe8dc]" />
                                    )}
                                    <h3 className="mt-4 text-base font-black text-[#143f38] dark:text-white">
                                        {guidance.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 font-semibold text-[#53645f] dark:text-white/62">
                                        {guidance.detail}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {LAYOUT_IMPLEMENTATION_SUGGESTIONS.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-xl border border-[#176456]/14 bg-[#143f38] p-5 text-white shadow-[0_18px_50px_rgba(14,60,52,0.1)] dark:border-white/10 dark:bg-white/[0.055]"
                                >
                                    <BadgeCheck className="h-5 w-5 text-[#f4dfad] dark:text-[#9fe8dc]" />
                                    <h3 className="mt-4 text-sm font-black text-white">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-6 font-semibold text-white/62">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 rounded-xl border border-[#176456]/14 bg-white p-5 shadow-[0_18px_50px_rgba(14,60,52,0.08)] sm:grid-cols-2 dark:border-white/10 dark:bg-white/[0.055]">
                            {TOUR_LAUNCH_STEPS.map((step) => (
                                <div
                                    key={step}
                                    className="flex items-start gap-3 rounded-lg border border-[#176456]/10 bg-[#edf2f1] p-3 dark:border-white/10 dark:bg-black/18"
                                >
                                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#176456] dark:text-[#9fe8dc]" />
                                    <p className="text-xs leading-6 font-semibold text-[#143f38] dark:text-white/68">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 rounded-xl border border-[#176456]/14 bg-white p-5 shadow-[0_18px_50px_rgba(14,60,52,0.08)] sm:grid-cols-2 dark:border-white/10 dark:bg-white/[0.055]">
                            {TOUR_RELEASE_CHECKLIST.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-lg border border-[#176456]/10 bg-[#edf2f1] p-4 dark:border-white/10 dark:bg-black/18"
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

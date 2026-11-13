import { create } from 'zustand';
import {
  AspectRatioType,
  CategoryType,
  COLOR_PALETTES,
  ColorPalette,
  CursorAnimationMode,
  CursorVisualSkin,
  GeneratedScriptResult,
  generateScript,
  MUSIC_TRACKS,
  MusicTrack,
  SceneItem,
  SceneTransition,
  AnimationType,
  CameraMotionType,
  buildNonRepeatingSequence,
  synthesizeAllSceneImagesFromDataPack,
} from '@/lib/smart-engine';

export type TemplateId = 'Q1' | 'Q2' | 'Q3' | 'P1' | 'P2' | 'P3' | 'E1' | 'E2' | 'E3';

export type FontFamilyName =
  | 'Poppins'
  | 'Montserrat'
  | 'Bebas Neue'
  | 'Playfair Display'
  | 'Space Grotesk'
  | 'Anton';

export interface ProjectStyleConfig {
  aspectRatio: AspectRatioType;
  font: FontFamilyName;
  colors: ColorPalette;
  backgroundType: 'solid' | 'gradient' | 'picsum' | 'upload' | 'datapack';
  solidColor: string;
  gradientPreset: string;
  backgroundImageUrl: string;
  userImages: string[];
  music: MusicTrack;
  showSubtitle: boolean;
  showEmoji: boolean;
  showProgressBar: boolean;
  cursorMode: CursorAnimationMode;
  cursorSkin: CursorVisualSkin;
  cursorSpeed: number;
  autoDataPackImages: boolean;
}

export interface EditorState {
  projectId: string;
  title: string;
  topic: string;
  category: CategoryType;
  templateId: TemplateId;
  script: GeneratedScriptResult;
  style: ProjectStyleConfig;
  activeSceneIndex: number;
  isPlaying: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';

  initProject: (payload: {
    id: string;
    title: string;
    topic: string;
    category: CategoryType;
    templateId: TemplateId;
    script?: GeneratedScriptResult;
    style?: Partial<ProjectStyleConfig>;
  }) => void;
  setActiveSceneIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setTemplateId: (templateId: TemplateId) => void;
  updateScene: (sceneIndex: number, partial: Partial<SceneItem>) => void;
  updateStyle: (partial: Partial<ProjectStyleConfig>) => void;
  updateColors: (colors: ColorPalette) => void;
  addUserImages: (urls: string[]) => void;
  removeUserImage: (index: number) => void;
  randomizeProject: () => void;
  randomizeNonRepeatingMotions: () => void;
  regenerateDataPackImages: (customQuery?: string) => void;
  setCursorMode: (mode: CursorAnimationMode) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
}

const initialScript = generateScript('Promo Kopi Susu Gula Aren 18rb', 'promo', {
  cursorMode: 'single-pro',
  useDataPackImages: true,
});

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: 'default-motionid-project',
  title: 'Promo Kopi Susu Gula Aren 18rb',
  topic: 'Promo Kopi Susu Gula Aren 18rb',
  category: 'promo',
  templateId: 'P1',
  script: initialScript,
  style: {
    aspectRatio: '9:16',
    font: 'Space Grotesk',
    colors: initialScript.suggestedColor || COLOR_PALETTES[0],
    backgroundType: 'datapack',
    solidColor: '#070815',
    gradientPreset: COLOR_PALETTES[0].gradient,
    backgroundImageUrl: initialScript.scenes[0]?.imageUrl || '',
    userImages: initialScript.scenes.map((s) => s.imageUrl || '').filter(Boolean),
    music: initialScript.suggestedMusic || MUSIC_TRACKS[0],
    showSubtitle: true,
    showEmoji: true,
    showProgressBar: true,
    cursorMode: 'single-pro',
    cursorSkin: 'figma-pill',
    cursorSpeed: 1,
    autoDataPackImages: true,
  },
  activeSceneIndex: 0,
  isPlaying: true,
  saveStatus: 'saved',

  initProject: (payload) => {
    const generated =
      payload.script ||
      generateScript(payload.topic, payload.category, {
        cursorMode: payload.style?.cursorMode ?? 'single-pro',
        useDataPackImages: true,
      });
    set((state) => ({
      projectId: payload.id,
      title: payload.title,
      topic: payload.topic,
      category: payload.category,
      templateId: payload.templateId,
      script: generated,
      style: {
        ...state.style,
        colors: generated.suggestedColor,
        music: generated.suggestedMusic,
        userImages: generated.scenes.map((s) => s.imageUrl || '').filter(Boolean),
        ...payload.style,
      },
      activeSceneIndex: 0,
      saveStatus: 'saved',
    }));
  },

  setActiveSceneIndex: (index) => set({ activeSceneIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setTemplateId: (templateId) => set({ templateId, saveStatus: 'unsaved' }),

  updateScene: (sceneIndex, partial) =>
    set((state) => {
      const nextScenes = state.script.scenes.map((sc, idx) =>
        idx === sceneIndex ? { ...sc, ...partial } : sc
      );
      return {
        script: { ...state.script, scenes: nextScenes },
        saveStatus: 'unsaved',
      };
    }),

  updateStyle: (partial) =>
    set((state) => ({
      style: { ...state.style, ...partial },
      saveStatus: 'unsaved',
    })),

  updateColors: (colors) =>
    set((state) => ({
      style: { ...state.style, colors, gradientPreset: colors.gradient },
      saveStatus: 'unsaved',
    })),

  addUserImages: (urls) =>
    set((state) => {
      const merged = [...state.style.userImages, ...urls];
      const nextScenes = state.script.scenes.map((sc, idx) => ({
        ...sc,
        imageUrl: merged[idx % merged.length] || sc.imageUrl,
      }));
      return {
        style: { ...state.style, userImages: merged },
        script: { ...state.script, scenes: nextScenes },
        saveStatus: 'unsaved',
      };
    }),

  removeUserImage: (index) =>
    set((state) => ({
      style: {
        ...state.style,
        userImages: state.style.userImages.filter((_, idx) => idx !== index),
      },
      saveStatus: 'unsaved',
    })),

  randomizeProject: () => {
    const { topic, category, style } = get();
    const fresh = generateScript(topic, category, {
      cursorMode: style.cursorMode,
      useDataPackImages: true,
      seed: Math.floor(Math.random() * 999999) + Date.now(),
    });
    set({
      script: fresh,
      style: {
        ...style,
        colors: fresh.suggestedColor,
        gradientPreset: fresh.suggestedColor.gradient,
        userImages: fresh.scenes.map((s) => s.imageUrl || '').filter(Boolean),
      },
      saveStatus: 'unsaved',
    });
  },

  randomizeNonRepeatingMotions: () =>
    set((state) => {
      const seed = Math.floor(Math.random() * 999999) + Date.now();
      const transitions = buildNonRepeatingSequence<SceneTransition>(
        ['whip-left', 'iris-wipe', 'diagonal-slice', 'zoom-punch', 'glitch-cut', 'morph-card', 'shutter-blinds', 'blueprint-wire'],
        state.script.scenes.length,
        seed
      );
      const animations = buildNonRepeatingSequence<AnimationType>(
        ['pop', 'slide-up', 'typewriter', 'bounce', 'zoom', 'fade'],
        state.script.scenes.length,
        seed + 19
      );
      const cameras = buildNonRepeatingSequence<CameraMotionType>(
        ['zoom-in', 'dutch-tilt', 'orbit-3d', 'pan-drift', 'handheld-float', 'zoom-out'],
        state.script.scenes.length,
        seed + 41
      );

      const nextScenes = state.script.scenes.map((sc, idx) => ({
        ...sc,
        transition: transitions[idx],
        animation: animations[idx],
        cameraMotion: cameras[idx],
      }));

      return {
        script: { ...state.script, scenes: nextScenes },
        saveStatus: 'unsaved',
      };
    }),

  regenerateDataPackImages: (customQuery) =>
    set((state) => {
      const queryToUse = customQuery?.trim() || state.topic;
      const synthList = synthesizeAllSceneImagesFromDataPack({
        topic: queryToUse,
        category: state.category,
        priceLabel: state.script.extractedMeta?.priceText,
        scenes: state.script.scenes.map((s) => ({ text: s.text, subtext: s.subtext })),
      });

      const nextScenes = state.script.scenes.map((sc, idx) => ({
        ...sc,
        imageUrl: synthList[idx]?.dataUri || sc.imageUrl,
        dataPackMeta: synthList[idx]
          ? {
              clusterId: synthList[idx].clusterId,
              packTitle: synthList[idx].packTitle,
              compositionStyle: synthList[idx].compositionStyle,
              matchedKeywords: synthList[idx].matchedKeywords,
            }
          : sc.dataPackMeta,
      }));

      return {
        script: {
          ...state.script,
          scenes: nextScenes,
          synthesizedPackImages: synthList,
        },
        style: {
          ...state.style,
          backgroundType: 'datapack',
          userImages: nextScenes.map((s) => s.imageUrl || '').filter(Boolean),
        },
        saveStatus: 'unsaved',
      };
    }),

  setCursorMode: (mode) =>
    set((state) => ({
      style: { ...state.style, cursorMode: mode },
      saveStatus: 'unsaved',
    })),

  setSaveStatus: (status) => set({ saveStatus: status }),
}));

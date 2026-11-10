import { create } from 'zustand';
import {
  AspectRatioType,
  CategoryType,
  ColorPalette,
  GeneratedScriptResult,
  generateScript,
  MusicTrack,
  randomizeHookAndStyle,
  SceneItem,
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
  backgroundType: 'solid' | 'gradient' | 'picsum' | 'upload';
  solidColor: string;
  gradientPreset: string;
  backgroundImageUrl: string;
  userImages: string[];
  music: MusicTrack;
  showSubtitle: boolean;
  showEmoji: boolean;
  showProgressBar: boolean;
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
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
}

const DEFAULT_TOPIC = 'Promo Kopi Susu Gula Aren 18rb';
const initialScript = generateScript(DEFAULT_TOPIC, 'promo', {
  customPrice: 'Rp 18rb',
  customProductName: 'Kopi Susu Gula Aren',
  customStoreName: 'Kopi Senja Kita',
});

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: 'demo-project-1',
  title: 'Promo Kopi Susu Gula Aren 18rb',
  topic: DEFAULT_TOPIC,
  category: 'promo',
  templateId: 'P1',
  script: initialScript,
  style: {
    aspectRatio: '9:16',
    font: initialScript.suggestedStyle.font,
    colors: initialScript.suggestedColor,
    backgroundType: 'gradient',
    solidColor: initialScript.suggestedColor.bgPrimary,
    gradientPreset: initialScript.suggestedStyle.gradientPreset,
    backgroundImageUrl: 'https://picsum.photos/seed/motionku-coffee/720/1280',
    userImages: [],
    music: initialScript.suggestedMusic,
    showSubtitle: true,
    showEmoji: true,
    showProgressBar: true,
  },
  activeSceneIndex: 0,
  isPlaying: true,
  saveStatus: 'saved',

  initProject: ({ id, title, topic, category, templateId, script, style }) => {
    const generated = script || generateScript(topic, category);
    set({
      projectId: id,
      title,
      topic,
      category,
      templateId,
      script: generated,
      style: {
        aspectRatio: style?.aspectRatio || '9:16',
        font: style?.font || generated.suggestedStyle.font,
        colors: style?.colors || generated.suggestedColor,
        backgroundType: style?.backgroundType || 'gradient',
        solidColor: style?.solidColor || generated.suggestedColor.bgPrimary,
        gradientPreset: style?.gradientPreset || generated.suggestedStyle.gradientPreset,
        backgroundImageUrl:
          style?.backgroundImageUrl || 'https://picsum.photos/seed/motionku-coffee/720/1280',
        userImages: style?.userImages || [],
        music: style?.music || generated.suggestedMusic,
        showSubtitle: style?.showSubtitle ?? true,
        showEmoji: style?.showEmoji ?? true,
        showProgressBar: style?.showProgressBar ?? true,
      },
      activeSceneIndex: 0,
      saveStatus: 'unsaved',
    });
  },

  setActiveSceneIndex: (index) => set({ activeSceneIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setTemplateId: (templateId) => set({ templateId, saveStatus: 'unsaved' }),

  updateScene: (sceneIndex, partial) =>
    set((state) => {
      const updatedScenes = state.script.scenes.map((scene, idx) =>
        idx === sceneIndex ? { ...scene, ...partial } : scene
      );
      return {
        script: {
          ...state.script,
          scenes: updatedScenes,
        },
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
      style: {
        ...state.style,
        colors,
        solidColor: colors.bgPrimary,
      },
      saveStatus: 'unsaved',
    })),

  addUserImages: (urls) =>
    set((state) => {
      const merged = [...state.style.userImages, ...urls];
      const updatedScenes = state.script.scenes.map((sc, idx) => ({
        ...sc,
        imageUrl: merged[idx % merged.length] || sc.imageUrl,
      }));
      return {
        script: {
          ...state.script,
          scenes: updatedScenes,
        },
        style: {
          ...state.style,
          backgroundType: 'upload',
          backgroundImageUrl: merged[0] || state.style.backgroundImageUrl,
          userImages: merged,
        },
        saveStatus: 'unsaved',
      };
    }),

  removeUserImage: (index) =>
    set((state) => {
      const filtered = state.style.userImages.filter((_, i) => i !== index);
      return {
        style: {
          ...state.style,
          userImages: filtered,
          backgroundImageUrl:
            filtered[0] || 'https://picsum.photos/seed/motionku-coffee/720/1280',
        },
        saveStatus: 'unsaved',
      };
    }),

  randomizeProject: () => {
    const state = get();
    const { newScript, randomPalette, randomMusic } = randomizeHookAndStyle(
      state.topic,
      state.category,
      state.style.colors.id,
      { userImages: state.style.userImages }
    );
    set({
      script: newScript,
      style: {
        ...state.style,
        colors: randomPalette,
        solidColor: randomPalette.bgPrimary,
        music: randomMusic,
      },
      activeSceneIndex: 0,
      saveStatus: 'unsaved',
    });
  },

  setSaveStatus: (status) => set({ saveStatus: status }),
}));

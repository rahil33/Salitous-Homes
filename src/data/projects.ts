export type ProjectMedia = {
  src: string
  alt: string
  type: 'image' | 'video'
  poster?: string
}
import { projectImageHeights } from './project-image-heights'

export function responsiveProjectImage(src: string) {
  const prefix = src.replace(/-800\.webp$/, '')
  return {
    srcSet: `${prefix}-480.webp 480w, ${prefix}-800.webp 800w, ${prefix}-1280.webp 1280w`,
    sizes: '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 800px',
    width: 800,
    height: projectImageHeights[src] ?? 600,
  }
}

export type Project = {
  id: string
  name: string
  region: 'karnataka' | 'tamil-nadu'
  media: ProjectMedia[]
  thumbnail: string
}

export const projects: Project[] = [
  {
    id: 'karnataka-01',
    name: 'Karnataka Project 01',
    region: 'karnataka',
    media: [
      { src: '/assets/projects/karnataka/images/karnataka-image-01-800.webp', alt: 'Karnataka Project 01 — Living Space', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-02-800.webp', alt: 'Karnataka Project 01 — Interior Detail', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-05-800.webp', alt: 'Karnataka Project 01 — Room View', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-08-800.webp', alt: 'Karnataka Project 01 — Design Accent', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-11-800.webp', alt: 'Karnataka Project 01 — Material Detail', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-14-800.webp', alt: 'Karnataka Project 01 — Space Overview', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-18-800.webp', alt: 'Karnataka Project 01 — Finished Interior', type: 'image' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-02.mp4', alt: 'Karnataka Project 01 — Walkthrough', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-02-poster.webp' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-01.mp4', alt: 'Karnataka Project 01 — Walkthrough 2', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-01-poster.webp' },
    ],
    thumbnail: '/assets/projects/covers/karnataka-01-800.webp',
  },
  {
    id: 'karnataka-02',
    name: 'Karnataka Project 02',
    region: 'karnataka',
    media: [
      { src: '/assets/projects/karnataka/images/karnataka-image-21-800.webp', alt: 'Karnataka Project 02 — Interior', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-22-800.webp', alt: 'Karnataka Project 02 — Detail', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-27-800.webp', alt: 'Karnataka Project 02 — Room', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-30-800.webp', alt: 'Karnataka Project 02 — Feature', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-33-800.webp', alt: 'Karnataka Project 02 — Space', type: 'image' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-05.mp4', alt: 'Karnataka Project 02 — Walkthrough', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-05-poster.webp' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-03.mp4', alt: 'Karnataka Project 02 — Walkthrough 2', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-03-poster.webp' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-04.mp4', alt: 'Karnataka Project 02 — Walkthrough 3', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-04-poster.webp' },
    ],
    thumbnail: '/assets/projects/covers/karnataka-02-800.webp',
  },
  {
    id: 'karnataka-03',
    name: 'Karnataka Project 03',
    region: 'karnataka',
    media: [
      { src: '/assets/projects/karnataka/images/karnataka-image-37-800.webp', alt: 'Karnataka Project 03 — Entrance', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-40-800.webp', alt: 'Karnataka Project 03 — Living Area', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-43-800.webp', alt: 'Karnataka Project 03 — Interior', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-46-800.webp', alt: 'Karnataka Project 03 — Detail', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-50-800.webp', alt: 'Karnataka Project 03 — Room', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-53-800.webp', alt: 'Karnataka Project 03 — Accent', type: 'image' },
      { src: '/assets/projects/karnataka/images/karnataka-image-54-800.webp', alt: 'Karnataka Project 03 — Final', type: 'image' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-08.mp4', alt: 'Karnataka Project 03 — Walkthrough', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-08-poster.webp' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-06.mp4', alt: 'Karnataka Project 03 — Walkthrough 2', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-06-poster.webp' },
      { src: '/assets/projects/karnataka/videos/karnataka-walkthrough-07.mp4', alt: 'Karnataka Project 03 — Walkthrough 3', type: 'video', poster: '/assets/projects/karnataka/videos/karnataka-walkthrough-07-poster.webp' },
    ],
    thumbnail: '/assets/projects/covers/karnataka-03-800.webp',
  },
  {
    id: 'tamil-nadu-01',
    name: 'Tamil Nadu Project 01',
    region: 'tamil-nadu',
    media: [
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-01-800.webp', alt: 'Tamil Nadu Project 01 — Living Room', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-04-800.webp', alt: 'Tamil Nadu Project 01 — Interior', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-07-800.webp', alt: 'Tamil Nadu Project 01 — Detail', type: 'image' },
    ],
    thumbnail: '/assets/projects/covers/tamil-nadu-01-800.webp',
  },
  {
    id: 'tamil-nadu-02',
    name: 'Tamil Nadu Project 02',
    region: 'tamil-nadu',
    media: [
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-06-800.webp', alt: 'Tamil Nadu Project 02 — Space', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-10-800.webp', alt: 'Tamil Nadu Project 02 — Interior', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-13-800.webp', alt: 'Tamil Nadu Project 02 — Room', type: 'image' },
    ],
    thumbnail: '/assets/projects/covers/tamil-nadu-02-800.webp',
  },
  {
    id: 'tamil-nadu-03',
    name: 'Tamil Nadu Project 03',
    region: 'tamil-nadu',
    media: [
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-12-800.webp', alt: 'Tamil Nadu Project 03 — Entrance', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-17-800.webp', alt: 'Tamil Nadu Project 03 — Interior', type: 'image' },
      { src: '/assets/projects/tamil-nadu/images/tamil-nadu-image-14-800.webp', alt: 'Tamil Nadu Project 03 — Detail', type: 'image' },
    ],
    thumbnail: '/assets/projects/covers/tamil-nadu-03-800.webp',
  },
]

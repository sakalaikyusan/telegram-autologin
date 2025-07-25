'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { AudioCategoryItem } from './AudioCategoryItem';
interface Audio {
  id: number;
  title: string;
  fileUrl: string;
  categoryId: number;
  categoryName?: string;
}
interface Category {
  id: number;
  name: string;
  description?: string;
  audios: Audio[];
}
interface AudioPreviewProps {
  filterCategoryIds?: number[];
}
export default function AudioPreview({
  filterCategoryIds
}: AudioPreviewProps) {
  const [audiosByCategory, setAudiosByCategory] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [expandedAudioId, setExpandedAudioId] = useState<number | null>(null);
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    fetchAudios();

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [filterCategoryIds]);
  const fetchAudios = async () => {
    try {
      setIsLoading(true);
      // Request all audio files
      const response = await fetch('/api/audio?limit=100&sort=asc');
      const data = await response.json();
      let audioList: Audio[] = [];
      if (data && data.audios && Array.isArray(data.audios)) {
        audioList = data.audios;
      } else if (Array.isArray(data)) {
        audioList = data;
      } else {
        console.error('Unexpected audio data format:', data);
        audioList = [];
      }

      // Ensure sorting by ID in ascending order
      audioList.sort((a, b) => a.id - b.id);

      // Fetch categories for grouping
      const catResponse = await fetch('/api/categories');
      const categoriesData = await catResponse.json();

      // Filter categories if filterCategoryIds is provided
      const filteredCategories = filterCategoryIds ? categoriesData.filter((category: any) => filterCategoryIds.includes(category.id)) : categoriesData;

      // Group audios by category
      const groupedData = filteredCategories.map((category: any) => {
        const categoryAudios = audioList.filter(audio => audio.categoryId === category.id) || [];
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          audios: categoryAudios
        };
      }).filter((category: Category) => category.audios.length > 0);

      // Initialize all categories as expanded
      const initialExpandedState: Record<number, boolean> = {};
      groupedData.forEach((category: Category) => {
        initialExpandedState[category.id] = true;
      });
      setExpandedCategories(initialExpandedState);
      setAudiosByCategory(groupedData);
    } catch (error) {
      console.error('Error fetching audios:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePlayAudio = (audio: Audio) => {
    const audioId = audio.id;

    // Create audio element if it doesn't exist
    if (!audioRefs.current[audioId]) {
      const audioElement = new Audio(audio.fileUrl);
      audioElement.addEventListener('ended', () => {
        setPlayingAudioId(null);
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration);
      });
      audioElement.addEventListener('durationchange', () => {
        setDuration(audioElement.duration);
      });
      audioRefs.current[audioId] = audioElement;
    }
    const audioElement = audioRefs.current[audioId];

    // If this audio is already playing, pause it
    if (playingAudioId === audioId) {
      audioElement?.pause();
      setPlayingAudioId(null);
      setExpandedAudioId(null);

      // Clear the interval that updates current time
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Pause any currently playing audio and clear existing interval
    if (playingAudioId !== null && audioRefs.current[playingAudioId]) {
      audioRefs.current[playingAudioId]?.pause();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Update volume and playback rate from previous settings
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume;
      audioElement.playbackRate = playbackRate;

      // Force load metadata if not already loaded
      if (audioElement.duration === 0 || isNaN(audioElement.duration)) {
        audioElement.load();
        audioElement.addEventListener('loadedmetadata', () => {
          setDuration(audioElement.duration);
        }, {
          once: true
        });
      } else {
        setDuration(audioElement.duration);
      }
      audioElement.play();

      // Set current time for the new audio
      setCurrentTime(0);

      // Set up interval to update currentTime frequently for smooth slider movement
      intervalRef.current = window.setInterval(() => {
        if (audioElement) {
          setCurrentTime(audioElement.currentTime);
          // Update duration if it wasn't set before
          if (duration === 0 && audioElement.duration > 0) {
            setDuration(audioElement.duration);
          }
        }
      }, 100); // Update every 100ms for smoother slider movement
    }
    setPlayingAudioId(audioId);
    setExpandedAudioId(audioId);
  };
  const handleDownload = async (audio: Audio) => {
    try {
      setDownloading(audio.id);

      // Fetch the audio file
      const response = await fetch(audio.fileUrl);
      const blob = await response.blob();

      // Create a downloadable link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${audio.title}.mp3`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      setDownloading(null);
      setDownloadSuccess(audio.id);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error downloading audio:', error);
      setDownloading(null);
    }
  };
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (playingAudioId !== null && audioRefs.current[playingAudioId]) {
      audioRefs.current[playingAudioId]!.currentTime = seekTime;
    }
  };
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (playingAudioId !== null && audioRefs.current[playingAudioId]) {
      audioRefs.current[playingAudioId]!.volume = isMuted ? volume : 0;
    }
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playingAudioId !== null && audioRefs.current[playingAudioId]) {
      audioRefs.current[playingAudioId]!.volume = isMuted ? 0 : newVolume;
    }
  };
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (playingAudioId !== null && audioRefs.current[playingAudioId]) {
      audioRefs.current[playingAudioId]!.playbackRate = rate;
    }
  };

  // Function to toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  if (isLoading) {
    return <div className="flex justify-center py-8" data-unique-id="2412ad2c-3ed0-4222-a9c0-02f1bfc661ba" data-file-name="components/preview/audio/AudioPreview.tsx">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" data-unique-id="b2c8ed6e-9dc0-4b33-b31f-64aa26aa0cce" data-file-name="components/preview/audio/AudioPreview.tsx"></div>
      </div>;
  }
  if (audiosByCategory.length === 0) {
    return <p className="text-center py-8 text-muted-foreground" data-unique-id="6a1b4dd1-0384-4ee2-9b1d-52032fab480a" data-file-name="components/preview/audio/AudioPreview.tsx"><span className="editable-text" data-unique-id="1c6fae42-822f-400d-b61f-9dcac75561e3" data-file-name="components/preview/audio/AudioPreview.tsx">Tidak ada audio yang tersedia.</span></p>;
  }
  return <div className="border rounded-lg p-6" data-unique-id="dd4b3347-69e7-48ef-813b-11493325b3f6" data-file-name="components/preview/audio/AudioPreview.tsx">
      <div className="space-y-8" data-unique-id="64078587-81f8-4e76-b844-aa20d83ba0e1" data-file-name="components/preview/audio/AudioPreview.tsx" data-dynamic-text="true">
        {audiosByCategory.map(category => <AudioCategoryItem key={category.id} category={category} isExpanded={!!expandedCategories[category.id]} toggleCategory={toggleCategory} playingAudioId={playingAudioId} expandedAudioId={expandedAudioId} handlePlayAudio={handlePlayAudio} handleDownload={handleDownload} formatTime={formatTime} currentTime={currentTime} duration={duration} handleSeek={handleSeek} toggleMute={toggleMute} isMuted={isMuted} volume={volume} handleVolumeChange={handleVolumeChange} changePlaybackRate={changePlaybackRate} playbackRate={playbackRate} downloading={downloading} downloadSuccess={downloadSuccess} />)}
      </div>
    </div>;
}
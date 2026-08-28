'use client';

import React from 'react';
import { StoryItem, StoryItemProps } from './StoryItem';

interface StoriesBarProps {
  stories: StoryItemProps[];
}

export function StoriesBar({ stories }: StoriesBarProps) {
  return (
    <div className="w-full bg-[#FAF9F6] pt-1 pb-3">
      <div className="flex gap-4 overflow-x-auto px-4 snap-x no-scrollbar">
        {stories.map((story) => (
          <div key={story.id} className="snap-start shrink-0 w-[calc(25vw-20px)] max-w-[80px]">
            <StoryItem {...story} />
          </div>
        ))}
      </div>
    </div>
  );
}

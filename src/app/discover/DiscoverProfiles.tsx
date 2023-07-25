'use client';
import { DiscoverProfile } from '@/app/discover/DiscoverProfile';
import { AllCaughtUp } from '@/components/AllCaughtUp';
import useOnScreen from '@/hooks/useOnScreen';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GetUser } from 'types';

const PROFILES_PER_PAGE = 4;
export function DiscoverProfiles() {
  const searchParams = useSearchParams();
  const bottomElRef = useRef<HTMLDivElement>(null);
  const isBottomOnScreen = useOnScreen(bottomElRef);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      'discover',
      {
        gender: searchParams.get('gender'),
        relationshipStatus: searchParams.get('relationship-status'),
      },
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('limit', PROFILES_PER_PAGE.toString());
      newSearchParams.set('offset', pageParam);

      const res = await fetch(`/api/users?${newSearchParams.toString()}`);
      if (!res.ok) {
        throw new Error('Error fetching discover profiles.');
      }
      return (await res.json()) as GetUser[];
    },
    getNextPageParam: (lastPage, pages) => {
      // If the `pages` `length` is 0, that means there is not a single profile to load
      if (pages.length === 0) return undefined;

      // If the `lastPage` is less than the limit, that means the end is reached
      if (lastPage.length < PROFILES_PER_PAGE) return undefined;

      // This will serve as the `offset`, add 1 to load next page
      return pages.flat().length + 1;
    },
    staleTime: 60000 * 10,
  });

  useEffect(() => {
    if (!isBottomOnScreen) return;
    if (!data) return;
    if (!hasNextPage) return;

    fetchNextPage();
  }, [isBottomOnScreen]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
        {status === 'loading' ? (
          <p>Loading profiles...</p>
        ) : status === 'error' ? (
          <p>Error loading profiles.</p>
        ) : (
          data?.pages
            .flat()
            .map((profile) => (
              <DiscoverProfile key={profile.id} user={profile} />
            ))
        )}
      </div>
      <div className="mt-4 h-4" ref={bottomElRef}></div>
      {!isFetching && !hasNextPage && <AllCaughtUp />}
    </>
  );
}

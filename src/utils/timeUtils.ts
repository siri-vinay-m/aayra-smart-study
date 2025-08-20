/**
 * Time utility functions for formatting and manipulating time values
 */

/**
 * Formats time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string in MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Formats time in seconds to HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string in HH:MM:SS format
 */
export function formatTimeWithHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Converts minutes to seconds
 * @param minutes - Time in minutes
 * @returns Time in seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Converts seconds to minutes
 * @param seconds - Time in seconds
 * @returns Time in minutes
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}
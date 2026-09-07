'use server'

export async function getSidebarChats() {
  return {
    favoriteChats: [],
    recentChats: { chats: [], cursor: null },
  }
}

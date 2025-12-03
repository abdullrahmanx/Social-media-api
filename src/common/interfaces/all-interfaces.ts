import { NotificationType, Prisma } from "@prisma/client"

export interface UserPayLoad {
    id: string
    name: string
    role : string
}


export interface AuthRequest {
    user?: UserPayLoad
}

export interface UploadFiles {
    url: string,
    type: "image" | "video" | "gif" | "doc" | "raw";
}


export interface NotificationData {
    type: NotificationType
    recipientId: string
    senderId: string
    postId?: string
    commentId?: string
    likeId?: string
    followId?: string
    chatId?: string,
    messageId?: string
}

export interface GetNotificationsPaginated {
    page?: number
    limit?: number
    sortBy?:string
    sortOrder: 'asc' | 'desc' 
    readOnly?: boolean
}

export interface GetPaginatedResponse<T> {
    data: T[],
    total: number,
    page: number,
    limit: number,
    prevPage: number | null
    nextPage: number | null
    totalPages: number
}

export type  NotificationContent = Prisma.NotificationGetPayload<{
   include: {
        sender: {
            select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true
                }
            },
            post: {
               select: {
                  id: true,
                        content: true,
                        media: true
                  }
            },
            comment: 
            {
                select: {
                    id: true,
                    content: true
                }
            },
            like: {
                select : { 
                    id: true,
                } 
            },
            follow: {
                select: {
                    id: true,
                }
            }
   }
}>
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      flashcards: {
        Row: {
          definitionexplanation: string
          flashcardid: string
          flashcardsetid: string
          keyconcept: string
          orderinset: number
        }
        Insert: {
          definitionexplanation: string
          flashcardid?: string
          flashcardsetid: string
          keyconcept: string
          orderinset: number
        }
        Update: {
          definitionexplanation?: string
          flashcardid?: string
          flashcardsetid?: string
          keyconcept?: string
          orderinset?: number
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_flashcardsetid_fkey"
            columns: ["flashcardsetid"]
            isOneToOne: false
            referencedRelation: "flashcardsets"
            referencedColumns: ["flashcardsetid"]
          },
        ]
      }
      flashcardsets: {
        Row: {
          aimodelused: string | null
          flashcardsetid: string
          generatedat: string
          reviewcycleentryid: string | null
          sessionid: string
        }
        Insert: {
          aimodelused?: string | null
          flashcardsetid?: string
          generatedat?: string
          reviewcycleentryid?: string | null
          sessionid: string
        }
        Update: {
          aimodelused?: string | null
          flashcardsetid?: string
          generatedat?: string
          reviewcycleentryid?: string | null
          sessionid?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcardsets_reviewcycleentryid_fkey"
            columns: ["reviewcycleentryid"]
            isOneToOne: false
            referencedRelation: "reviewcycleentries"
            referencedColumns: ["entryid"]
          },
          {
            foreignKeyName: "flashcardsets_sessionid_fkey"
            columns: ["sessionid"]
            isOneToOne: false
            referencedRelation: "studysessions"
            referencedColumns: ["sessionid"]
          },
        ]
      }
      quizquestions: {
        Row: {
          correctanswer: string
          explanation: string | null
          optionsjson: Json | null
          orderinquiz: number
          questionid: string
          questiontext: string
          questiontype: string
          quizid: string
        }
        Insert: {
          correctanswer: string
          explanation?: string | null
          optionsjson?: Json | null
          orderinquiz: number
          questionid?: string
          questiontext: string
          questiontype: string
          quizid: string
        }
        Update: {
          correctanswer?: string
          explanation?: string | null
          optionsjson?: Json | null
          orderinquiz?: number
          questionid?: string
          questiontext?: string
          questiontype?: string
          quizid?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizquestions_quizid_fkey"
            columns: ["quizid"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["quizid"]
          },
        ]
      }
      quizzes: {
        Row: {
          aimodelused: string | null
          generatedat: string
          numberofquestions: number
          quizid: string
          quiztitle: string | null
          reviewcycleentryid: string | null
          sessionid: string
        }
        Insert: {
          aimodelused?: string | null
          generatedat?: string
          numberofquestions?: number
          quizid?: string
          quiztitle?: string | null
          reviewcycleentryid?: string | null
          sessionid: string
        }
        Update: {
          aimodelused?: string | null
          generatedat?: string
          numberofquestions?: number
          quizid?: string
          quiztitle?: string | null
          reviewcycleentryid?: string | null
          sessionid?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_reviewcycleentryid_fkey"
            columns: ["reviewcycleentryid"]
            isOneToOne: false
            referencedRelation: "reviewcycleentries"
            referencedColumns: ["entryid"]
          },
          {
            foreignKeyName: "quizzes_sessionid_fkey"
            columns: ["sessionid"]
            isOneToOne: false
            referencedRelation: "studysessions"
            referencedColumns: ["sessionid"]
          },
        ]
      }
      reviewcycleentries: {
        Row: {
          createdat: string
          currentreviewduedate: string
          entryid: string
          initialappearancedate: string
          lastquizidforreview: string | null
          reviewstage: number
          sessionid: string
          status: string
          updatedat: string
          userid: string
        }
        Insert: {
          createdat?: string
          currentreviewduedate: string
          entryid?: string
          initialappearancedate: string
          lastquizidforreview?: string | null
          reviewstage: number
          sessionid: string
          status?: string
          updatedat?: string
          userid: string
        }
        Update: {
          createdat?: string
          currentreviewduedate?: string
          entryid?: string
          initialappearancedate?: string
          lastquizidforreview?: string | null
          reviewstage?: number
          sessionid?: string
          status?: string
          updatedat?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_review_cycle_last_quiz"
            columns: ["lastquizidforreview"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["quizid"]
          },
          {
            foreignKeyName: "reviewcycleentries_sessionid_fkey"
            columns: ["sessionid"]
            isOneToOne: false
            referencedRelation: "studysessions"
            referencedColumns: ["sessionid"]
          },
          {
            foreignKeyName: "reviewcycleentries_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      studysessions: {
        Row: {
          breakdurationminutes: number
          createdat: string
          focusdurationminutes: number
          isfavorite: boolean
          lastreviewedat: string | null
          sequencenumber: number
          sessionid: string
          sessionname: string
          status: string
          subjectname: string
          topicname: string
          updatedat: string
          userid: string
        }
        Insert: {
          breakdurationminutes?: number
          createdat?: string
          focusdurationminutes?: number
          isfavorite?: boolean
          lastreviewedat?: string | null
          sequencenumber: number
          sessionid?: string
          sessionname: string
          status?: string
          subjectname: string
          topicname: string
          updatedat?: string
          userid: string
        }
        Update: {
          breakdurationminutes?: number
          createdat?: string
          focusdurationminutes?: number
          isfavorite?: boolean
          lastreviewedat?: string | null
          sequencenumber?: number
          sessionid?: string
          sessionname?: string
          status?: string
          subjectname?: string
          topicname?: string
          updatedat?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "studysessions_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      subscriptionplans: {
        Row: {
          adsenabled: boolean
          billingcycle: string
          createdat: string
          featuresdescription: string | null
          isactive: boolean
          maxsessionsperday: number | null
          maxsessionsperweek: number | null
          planid: string
          planname: string
          price: number
          stripepriceid: string | null
          trialperioddescription: string | null
          updatedat: string
        }
        Insert: {
          adsenabled?: boolean
          billingcycle: string
          createdat?: string
          featuresdescription?: string | null
          isactive?: boolean
          maxsessionsperday?: number | null
          maxsessionsperweek?: number | null
          planid?: string
          planname: string
          price: number
          stripepriceid?: string | null
          trialperioddescription?: string | null
          updatedat?: string
        }
        Update: {
          adsenabled?: boolean
          billingcycle?: string
          createdat?: string
          featuresdescription?: string | null
          isactive?: boolean
          maxsessionsperday?: number | null
          maxsessionsperweek?: number | null
          planid?: string
          planname?: string
          price?: number
          stripepriceid?: string | null
          trialperioddescription?: string | null
          updatedat?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          aimodelused: string | null
          generatedat: string
          sessionid: string
          summaryid: string
          summarytext: string
        }
        Insert: {
          aimodelused?: string | null
          generatedat?: string
          sessionid: string
          summaryid?: string
          summarytext: string
        }
        Update: {
          aimodelused?: string | null
          generatedat?: string
          sessionid?: string
          summaryid?: string
          summarytext?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_sessionid_fkey"
            columns: ["sessionid"]
            isOneToOne: true
            referencedRelation: "studysessions"
            referencedColumns: ["sessionid"]
          },
        ]
      }
      uploadedmaterials: {
        Row: {
          contenttext: string | null
          filesize: number | null
          filestoragepath: string | null
          materialid: string
          materialtype: string
          originalfilename: string | null
          sessionid: string
          uploadedat: string
          voicetranscript: string | null
        }
        Insert: {
          contenttext?: string | null
          filesize?: number | null
          filestoragepath?: string | null
          materialid?: string
          materialtype: string
          originalfilename?: string | null
          sessionid: string
          uploadedat?: string
          voicetranscript?: string | null
        }
        Update: {
          contenttext?: string | null
          filesize?: number | null
          filestoragepath?: string | null
          materialid?: string
          materialtype?: string
          originalfilename?: string | null
          sessionid?: string
          uploadedat?: string
          voicetranscript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploadedmaterials_sessionid_fkey"
            columns: ["sessionid"]
            isOneToOne: false
            referencedRelation: "studysessions"
            referencedColumns: ["sessionid"]
          },
        ]
      }
      user_session_usage: {
        Row: {
          created_at: string | null
          date: string
          id: string
          sessions_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          sessions_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          sessions_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usernotifications: {
        Row: {
          createdat: string
          isread: boolean
          message: string
          notificationid: string
          notificationtype: string
          relatedentityid: string | null
          relatedentitytype: string | null
          scheduledtime: string
          senttime: string | null
          userid: string
        }
        Insert: {
          createdat?: string
          isread?: boolean
          message: string
          notificationid?: string
          notificationtype: string
          relatedentityid?: string | null
          relatedentitytype?: string | null
          scheduledtime: string
          senttime?: string | null
          userid: string
        }
        Update: {
          createdat?: string
          isread?: boolean
          message?: string
          notificationid?: string
          notificationtype?: string
          relatedentityid?: string | null
          relatedentitytype?: string | null
          scheduledtime?: string
          senttime?: string | null
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "usernotifications_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      userquestionanswers: {
        Row: {
          answeredat: string
          answerid: string
          attemptid: string
          iscorrect: boolean
          questionid: string
          selectedanswer: string
        }
        Insert: {
          answeredat?: string
          answerid?: string
          attemptid: string
          iscorrect: boolean
          questionid: string
          selectedanswer: string
        }
        Update: {
          answeredat?: string
          answerid?: string
          attemptid?: string
          iscorrect?: boolean
          questionid?: string
          selectedanswer?: string
        }
        Relationships: [
          {
            foreignKeyName: "userquestionanswers_attemptid_fkey"
            columns: ["attemptid"]
            isOneToOne: false
            referencedRelation: "userquizattempts"
            referencedColumns: ["attemptid"]
          },
          {
            foreignKeyName: "userquestionanswers_questionid_fkey"
            columns: ["questionid"]
            isOneToOne: false
            referencedRelation: "quizquestions"
            referencedColumns: ["questionid"]
          },
        ]
      }
      userquizattempts: {
        Row: {
          attemptid: string
          completedat: string | null
          quizid: string
          score: number | null
          startedat: string
          status: string
          userid: string
        }
        Insert: {
          attemptid?: string
          completedat?: string | null
          quizid: string
          score?: number | null
          startedat?: string
          status?: string
          userid: string
        }
        Update: {
          attemptid?: string
          completedat?: string | null
          quizid?: string
          score?: number | null
          startedat?: string
          status?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "userquizattempts_quizid_fkey"
            columns: ["quizid"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["quizid"]
          },
          {
            foreignKeyName: "userquizattempts_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      users: {
        Row: {
          createdat: string
          currentsubscriptionid: string | null
          displayname: string
          email: string
          emailverified: boolean
          last_session_date: string | null
          last_weekly_reset_date: string | null
          lastloginat: string | null
          passwordhash: string
          preferredstudystarttime: string | null
          preferredstudyweekdays: string | null
          profilepictureurl: string | null
          sessions_used_this_week: number | null
          sessions_used_today: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          studentcategory: string
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          updatedat: string
          userid: string
          verificationtoken: string | null
        }
        Insert: {
          createdat?: string
          currentsubscriptionid?: string | null
          displayname: string
          email: string
          emailverified?: boolean
          last_session_date?: string | null
          last_weekly_reset_date?: string | null
          lastloginat?: string | null
          passwordhash: string
          preferredstudystarttime?: string | null
          preferredstudyweekdays?: string | null
          profilepictureurl?: string | null
          sessions_used_this_week?: number | null
          sessions_used_today?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          studentcategory: string
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          updatedat?: string
          userid?: string
          verificationtoken?: string | null
        }
        Update: {
          createdat?: string
          currentsubscriptionid?: string | null
          displayname?: string
          email?: string
          emailverified?: boolean
          last_session_date?: string | null
          last_weekly_reset_date?: string | null
          lastloginat?: string | null
          passwordhash?: string
          preferredstudystarttime?: string | null
          preferredstudyweekdays?: string | null
          profilepictureurl?: string | null
          sessions_used_this_week?: number | null
          sessions_used_today?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          studentcategory?: string
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          updatedat?: string
          userid?: string
          verificationtoken?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_current_subscription"
            columns: ["currentsubscriptionid"]
            isOneToOne: false
            referencedRelation: "usersubscriptions"
            referencedColumns: ["subscriptionid"]
          },
        ]
      }
      usersubscriptions: {
        Row: {
          createdat: string
          enddate: string | null
          paymentgatewaysubscriptionid: string | null
          planid: string
          startdate: string
          status: string
          subscriptionid: string
          updatedat: string
          userid: string
        }
        Insert: {
          createdat?: string
          enddate?: string | null
          paymentgatewaysubscriptionid?: string | null
          planid: string
          startdate: string
          status: string
          subscriptionid?: string
          updatedat?: string
          userid: string
        }
        Update: {
          createdat?: string
          enddate?: string | null
          paymentgatewaysubscriptionid?: string | null
          planid?: string
          startdate?: string
          status?: string
          subscriptionid?: string
          updatedat?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "usersubscriptions_planid_fkey"
            columns: ["planid"]
            isOneToOne: false
            referencedRelation: "subscriptionplans"
            referencedColumns: ["planid"]
          },
          {
            foreignKeyName: "usersubscriptions_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_free_plan_days_remaining: {
        Args: { user_created_at: string }
        Returns: number
      }
      calculate_next_review_date: {
        Args: { current_stage: number }
        Returns: string
      }
      can_create_session: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      complete_review_cycle: {
        Args: { entry_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

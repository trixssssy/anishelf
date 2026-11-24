// Types légers utilisés par les services. Le schéma SQL reste la source de vérité.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

CREATE TABLE "visualizer_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text,
	"embedding" "FLOAT"[1024],
	CONSTRAINT "visualizer_embeddings_id_unique" UNIQUE("id")
);

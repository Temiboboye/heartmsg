import StoryEditor from "@/components/StoryEditor";

export const metadata = {
    title: "Create | OurLoveNotes",
};

export default function CreatePage() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-stone-50">
            <StoryEditor />
        </div>
    );
}

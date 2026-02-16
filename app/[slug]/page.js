import Survey from "@/components/Survey"

export default function SurveyPage({ params }) {
    return <Survey slug={params.slug} />
}

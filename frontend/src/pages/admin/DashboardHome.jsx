import DashboardPage from "./DashboardPage";

export default function DashboardHome({ coverImg, ...dashboardProps }) {
  return (
    <>
      <DashboardPage {...dashboardProps} />
      <div className="mt-4 rounded-xl overflow-hidden shadow-md w-full flex-shrink-0">
        <img src={coverImg} alt="Poornima University" className="w-full h-24 sm:h-32 md:h-auto md:aspect-[4/1] object-cover object-center transform transition-transform duration-700" />
      </div>
    </>
  );
}

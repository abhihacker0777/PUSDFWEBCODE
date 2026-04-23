export default function Filters({
  courses, years, specs, sems, exams,
  selected, handleSelect
}) {
  const scrollbarStyles = "flex flex-nowrap gap-[15px] overflow-x-auto py-[10px] pr-10 w-full [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ffc107] [&::-webkit-scrollbar-thumb]:rounded-[20px] hover:[&::-webkit-scrollbar-thumb]:bg-[#05488B]";
  
  const baseCard = "flex-shrink-0 px-8 py-3 rounded-2xl cursor-pointer min-w-[146px] whitespace-nowrap text-center shadow-md hover:shadow-lg transition-all border-2 border-solid border-transparent box-border font-medium flex items-center justify-center";
  
  const activeCard = "bg-[#4a80bc] text-white border-[#ffc107] !border-[#ffc107] !border-solid !border-[2px] shadow-md";

  const renderRow = (title, items, type, isSelected) => {
    // BUG FIX: Added ?.length to prevent crash if items is temporarily null
    if (!items || items?.length === 0) return null;

    const sortedItems = type === "specialization" 
      ? [...items].sort((a, b) => a.localeCompare(b)) 
      : items;

    return (
      <div className="w-full mb-4">
        <h3 className="mt-[25px] font-bold text-gray-800 text-lg mb-2">{title}</h3>
        <div className={scrollbarStyles}>
          {sortedItems.map((item, i) => {
            const isActive = isSelected === item;
            return (
              <button
                type="button" 
                // BUG FIX: Made key unique by adding type to prevent UI update glitches
                key={`${type}-${item}-${i}`} 
                onClick={() => handleSelect(type, item)}
                className={`${baseCard} ${isActive ? activeCard : "bg-white text-gray-700"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderRow("Course", courses, "course", selected.course)}
      
      {selected.course && 
        renderRow("Year", years, "year", selected.year)}
      
      {/* BUG FIX: Added ?.length check here to prevent crashes during data fetch */}
      {selected.year && (specs?.length > 0) && 
        renderRow("Specialization", specs, "specialization", selected.specialization)}
      
      {/* BUG FIX: Added ?.length check to ensure semester shows correctly if no specs exist */}
      {(selected.specialization || (selected.year && (specs?.length === 0))) && selected.year &&
        renderRow("Semester", sems, "sem", selected.sem)}
      
      {selected.sem && 
        renderRow("Exam", exams, "exam", selected.exam)}
    </div>
  );
}
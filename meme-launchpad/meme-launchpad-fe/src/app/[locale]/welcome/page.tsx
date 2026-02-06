import Link from "next/link";

export default function Home() {
    return (
        <>
            <div className='hidden lg:block min-h-screen bg-gray-50'>
                {/* Hero Section */}
                <div className='relative py-20'>
                    <div className='flex justify-center items-center'>
                        <img
                            src='/assets/index/start.svg'
                            alt='Metaland'
                            className='w-auto h-[198px] z-10'
                        />
                    </div>

                    <div className="bg-[url('/assets/index/banner.svg')] bg-no-repeat bg-center bg-cover w-[1502px] h-[926px] absolute top-[100px] left-[50%] translate-x-[-50%] z-[1]"></div>

                    <div className='flex justify-center items-center mt-10'>
                        <img
                            src='/assets/index/banner_1.svg'
                            alt='Metaland'
                            className='w-[1080px] z-10 h-auto'
                        />
                    </div>

                    <div className='flex justify-center items-center mt-10'>
                        <div className="bg-[url('/assets/index/btn.svg')] bg-no-repeat bg-center bg-cover w-[290px] h-[50px] leading-[50px] z-10">
                            <Link href='/' className='block text-black text-center text-[16px] font-bold'>
                                Launch App
                            </Link>
                        </div>
                    </div>
                </div>

                {/* PARTNERS */}
                <div className="flex flex-col justify-center items-center z-10 mt-10 h-[780px] bg-[url('/assets/index/banner_02.svg')] bg-no-repeat bg-center bg-cover">
                    <h2 className='flex justify-center items-center text-[#e4e4e4] text-[80px] font-bold'>
                        PARTNERS
                    </h2>

                    <div className='flex justify-center items-center mt-20'>
                        <img src='/assets/index/partners.svg' alt='Metaland' />
                    </div>
                </div>

                {/* What is metaland */}
                <div className='flex flex-col justify-center items-center'>
                    <div className='w-full p-20'>
                        <img src='/assets/index/what.svg' alt='Metaland' />
                    </div>

                    <div className='flex justify-between w-full px-20'>
                        <div>
                            <img
                                src='/assets/index/desc_1.svg'
                                alt='Metaland'
                                className='w-[388px] h-[609px]'
                            />
                        </div>

                        <div>
                            <img
                                src='/assets/index/desc_2.svg'
                                alt='Metaland'
                                className='w-[388px] h-[609px]'
                            />
                        </div>

                        <div>
                            <img
                                src='/assets/index/desc_3.svg'
                                alt='Metaland'
                                className='w-[388px] h-[609px]'
                            />
                        </div>

                        <div>
                            <img
                                src='/assets/index/desc_4.svg'
                                alt='Metaland'
                                className='w-[388px] h-[609px]'
                            />
                        </div>
                    </div>
                </div>

                <div className='flex flex-col justify-center pt-20 items-center'>
                    <img src='/assets/index/co_build.svg' alt='Metaland' />

                    <img
                        src='/assets/index/build.svg'
                        alt='Metaland'
                        className='w-[804.3px] h-[483.48px]'
                    />

                    <div className='p-20'>
                        <img src='/assets/index/build_2.svg' alt='Metaland' className='w-full' />
                    </div>
                </div>

                <div>
                    <img src='/assets/index/feature.svg' alt='Metaland' />
                </div>

                <div>
                    <img src='/assets/index/innovative.svg' alt='Metaland' />
                </div>

                <div className="h-[747px] flex flex-col pt-20 bg-[url('/assets/index/contact.svg')] bg-no-repeat bg-center bg-coverg">
                    {/* <img src="/assets/index/contact.svg" alt="Metaland" /> */}

                    <div className='flex flex-col items-center mt-[400px]'>
                        <p className='text-[#9E9E9E] text-[16px] '>
                            Place auxiliary copy here，Place auxiliary copy herePlace auxiliary copy
                            herePlace auxiliary copy herePlace auxiliary copy herePlace auxiliary
                            copy herePlace auxiliary copy here
                        </p>
                        <div className="bg-[url('/assets/index/btn_b.svg')] mt-10 bg-no-repeat bg-center bg-coverg w-[290px] h-[50px] flex justify-center leading-[50px]">
                            <span className='text-[#fff]'>Contact Now</span>
                        </div>
                    </div>
                </div>

                <div className='mt-10'>
                    <img src='/assets/index/f_1.svg' alt='Metaland' />
                </div>
            </div>

            <div className='block lg:hidden min-h-screen bg-gray-50'>
                {/* Mobile Hero Section */}
                <div className='relative py-10 px-4'>
                    <div className='flex justify-center items-center'>
                        <img
                            src='/assets/index/start.svg'
                            alt='Metaland'
                            className='w-auto h-[100px]'
                        />
                    </div>

                    <div className='flex justify-center items-center mt-6'>
                        <img
                            src='/assets/index/banner_1.svg'
                            alt='Metaland'
                            className='w-full max-w-[360px] h-auto'
                        />
                    </div>

                    <div className='flex justify-center items-center mt-8'>
                        <div className="bg-[url('/assets/index/btn.svg')] bg-no-repeat bg-center bg-cover w-[240px] h-[45px] leading-[45px] cursor-pointer active:opacity-80">
                            <p className='text-black text-center text-[14px] font-bold'>
                                Launch App
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile PARTNERS */}
                <div className='flex flex-col justify-center items-center py-10 px-4 bg-gradient-to-b from-gray-50 to-gray-100'>
                    <h2 className='text-gray-300 text-[40px] font-bold text-center'>
                        PARTNERS
                    </h2>

                    <div className='flex flex-wrap justify-center items-center gap-6 mt-8 max-w-[360px]'>
                        <img
                            src='/assets/index/partners.svg'
                            alt='Partners'
                            className='w-full'
                        />
                    </div>
                </div>

                {/* Mobile What is metaland */}
                <div className='flex flex-col justify-center items-center px-4 py-10'>
                    <div className='w-full mb-8'>
                        <img
                            src='/assets/index/what.svg'
                            alt='What is Metaland'
                            className='w-full'
                        />
                    </div>

                    <div className='flex flex-col gap-6 w-full max-w-[360px]'>
                        <div className='w-full'>
                            <img
                                src='/assets/index/desc_1.svg'
                                alt='Description 1'
                                className='w-full h-auto'
                            />
                        </div>

                        <div className='w-full'>
                            <img
                                src='/assets/index/desc_2.svg'
                                alt='Description 2'
                                className='w-full h-auto'
                            />
                        </div>

                        <div className='w-full'>
                            <img
                                src='/assets/index/desc_3.svg'
                                alt='Description 3'
                                className='w-full h-auto'
                            />
                        </div>

                        <div className='w-full'>
                            <img
                                src='/assets/index/desc_4.svg'
                                alt='Description 4'
                                className='w-full h-auto'
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Co-build */}
                <div className='flex flex-col justify-center items-center px-4 py-10 bg-gray-50'>
                    <img
                        src='/assets/index/co_build.svg'
                        alt='Co-build'
                        className='w-full max-w-[300px]'
                    />

                    <img
                        src='/assets/index/build.svg'
                        alt='Build'
                        className='w-full max-w-[360px] h-auto mt-6'
                    />

                    <div className='mt-8 w-full'>
                        <img
                            src='/assets/index/build_2.svg'
                            alt='Build 2'
                            className='w-full'
                        />
                    </div>
                </div>

                {/* Mobile Feature */}
                <div className='w-full px-4 py-10'>
                    <img
                        src='/assets/index/feature.svg'
                        alt='Feature'
                        className='w-full'
                    />
                </div>

                {/* Mobile Innovative */}
                <div className='w-full px-4 py-10'>
                    <img
                        src='/assets/index/innovative.svg'
                        alt='Innovative'
                        className='w-full'
                    />
                </div>

                {/* Mobile Contact */}
                <div className='flex flex-col items-center px-4 py-10 bg-gradient-to-b from-gray-100 to-gray-200'>
                    <h2 className='text-gray-800 text-[32px] font-bold text-center mb-6'>
                        Contact Us
                    </h2>

                    <p className='text-gray-600 text-[14px] text-center leading-relaxed mb-8 max-w-[360px]'>
                        Place auxiliary copy here，Place auxiliary copy here Place auxiliary copy here
                        Place auxiliary copy here Place auxiliary copy here
                    </p>

                    <div className="bg-[url('/assets/index/btn_b.svg')] bg-no-repeat bg-center bg-cover w-[240px] h-[45px] flex justify-center items-center cursor-pointer active:opacity-80">
                        <span className='text-white text-[14px] font-semibold'>Contact Now</span>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className='w-full px-4 py-8'>
                    <img
                        src='/assets/index/f_1.svg'
                        alt='Footer'
                        className='w-full'
                    />
                </div>
            </div>
        </>
    );
}

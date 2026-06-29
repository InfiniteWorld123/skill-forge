export type AdminEndpointSkeleton = {
	area: string;
	api: string;
	method: string;
	path: string;
	businessMeaning: string;
	dataSource: string[];
	futureLogic: string[];
};

type CreateAdminEndpointSkeletonInput = AdminEndpointSkeleton;

export const createAdminEndpointSkeleton = ({
	area,
	api,
	method,
	path,
	businessMeaning,
	dataSource,
	futureLogic,
}: CreateAdminEndpointSkeletonInput): AdminEndpointSkeleton => {
	return {
		area,
		api,
		method,
		path,
		businessMeaning,
		dataSource,
		futureLogic,
	};
};
